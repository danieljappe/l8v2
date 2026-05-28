import React, { useState, useCallback } from 'react';
import {
  DndContext,
  type DragEndEvent, type DragStartEvent, type DragOverEvent,
  PointerSensor, useSensor, useSensors, closestCenter, DragOverlay,
  useDraggable, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TimelineItem, TimelineItemType } from '../../types/admin';
import apiService from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type UIType = TimelineItemType;

interface BookedArtist {
  id: string; // event_artist id
  artist: { id: string; name: string };
}

interface Props {
  eventId: string;
  eventArtists: BookedArtist[];
  initialTimeline: TimelineItem[];
}

interface AddFormState {
  afterPosition: number;
  type: UIType;
  title: string;
  eventArtistId: string;
  startTime: string;
  durationMinutes: string;
  collaboratorIds: string[];
}

interface DerivedItem {
  item: TimelineItem;
  effectiveStart: string | null;
  isComputed: boolean;
  warnings: ('gap' | 'overlap' | 'missing-duration')[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function deriveTimeline(items: TimelineItem[]): DerivedItem[] {
  const result: DerivedItem[] = [];
  let lastEndMinutes: number | null = null;

  for (const item of items) {
    const d: DerivedItem = { item, effectiveStart: null, isComputed: false, warnings: [] };

    if (item.startTime) {
      const startMin = timeToMinutes(item.startTime);
      d.effectiveStart = item.startTime;
      d.isComputed = false;
      if (lastEndMinutes !== null) {
        if (startMin > lastEndMinutes + 1) d.warnings.push('gap');
        else if (startMin < lastEndMinutes - 1) d.warnings.push('overlap');
      }
      lastEndMinutes = item.durationMinutes != null ? startMin + item.durationMinutes : null;
    } else if (lastEndMinutes !== null) {
      d.effectiveStart = minutesToTime(lastEndMinutes);
      d.isComputed = true;
      lastEndMinutes = item.durationMinutes != null ? lastEndMinutes + item.durationMinutes : null;
    } else {
      lastEndMinutes = null;
    }

    if (d.effectiveStart && item.durationMinutes == null) {
      d.warnings.push('missing-duration');
    }

    result.push(d);
  }
  return result;
}

function totalRuntime(items: TimelineItem[]): number {
  return items.reduce((sum, i) => sum + (i.durationMinutes ?? 0), 0);
}

// ─── Type metadata ────────────────────────────────────────────────────────────

const TYPE_META: Record<UIType, { label: string; bg: string; color: string }> = {
  artist_set: { label: 'Artist',  bg: 'var(--accent-soft)', color: 'var(--accent)' },
  dj_set:     { label: 'DJ Set',  bg: 'oklch(0.93 0.04 280)', color: 'oklch(0.55 0.16 280)' },
  break:      { label: 'Break',   bg: 'var(--bg-2)', color: 'var(--ink-3)' },
  talk:       { label: 'Talk',    bg: 'oklch(0.93 0.04 220)', color: 'oklch(0.52 0.12 220)' },
  custom:     { label: 'Custom',  bg: 'var(--bg-2)', color: 'var(--ink-2)' },
  collab_set: { label: 'Collab',  bg: 'oklch(0.93 0.05 45)',  color: 'oklch(0.58 0.2 45)' },
};

const ALL_TYPES: UIType[] = ['break', 'custom', 'collab_set'];

// ─── Icons ────────────────────────────────────────────────────────────────────

const DragHandleIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="4"  r="1.2"/><circle cx="5" cy="8"  r="1.2"/><circle cx="5" cy="12" r="1.2"/>
    <circle cx="11" cy="4" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const APPEND_ZONE_ID = 'append-zone';

// ─── Append drop zone (shown below list when dragging a booking) ──────────────

function AppendDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: APPEND_ZONE_ID });
  return (
    <div ref={setNodeRef} className={`a-tl-append-zone${isOver ? ' is-over' : ''}`} />
  );
}

// ─── Draggable booking chip ────────────────────────────────────────────────────

function DraggableBookingChip({ ea }: { ea: BookedArtist }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `booking-${ea.id}`,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="a-tl-booking-chip is-draggable"
      style={{ opacity: isDragging ? 0.35 : 1 }}
    >
      <div className="a-tl-booking-chip-placeholder" />
      {ea.artist.name}
    </div>
  );
}

// ─── Sortable timeline item ────────────────────────────────────────────────────

interface SortableItemProps {
  derived: DerivedItem;
  isDropTarget: boolean;
  onDelete: (id: string) => void;
  onBlurTime: (id: string, startTime: string | undefined) => void;
  onBlurDuration: (id: string, mins: number | undefined) => void;
}

function SortableItem({ derived, isDropTarget, onDelete, onBlurTime, onBlurDuration }: SortableItemProps) {
  const { item, effectiveStart, isComputed, warnings } = derived;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayType: UIType = item.type;
  const meta = TYPE_META[displayType] ?? TYPE_META.custom;

  return (
    <>
      {isDropTarget && <div className="a-tl-drop-line" />}
      <div ref={setNodeRef} style={style} className={`a-tl-item${isDragging ? ' is-dragging' : ''}`}>
        <button className="a-tl-handle" {...attributes} {...listeners} type="button" tabIndex={-1}>
          <DragHandleIcon />
        </button>

        <span className="a-tl-pos">{item.position}</span>

        <span className="a-tl-type" style={{ background: meta.bg, color: meta.color }}>
          {meta.label}
        </span>

        {displayType === 'artist_set' && (
          item.artistImageUrl
            ? <img className="a-tl-photo" src={item.artistImageUrl} alt="" />
            : <div className="a-tl-photo-placeholder" />
        )}

        <span className="a-tl-title">{item.title}</span>

        <div className="a-tl-times">
          <div className="a-tl-time-field">
            <span className="a-tl-field-lbl">Start</span>
            <input
              type="text"
              className={`a-tl-time-input${isComputed && !item.startTime ? ' is-computed' : ''}`}
              placeholder={effectiveStart ?? 'HH:MM'}
              defaultValue={item.startTime ?? ''}
              title={isComputed ? `Auto-computed from previous slot: ${effectiveStart}` : 'Start time (HH:MM)'}
              onBlur={e => {
                const val = e.target.value.trim();
                const resolved = val || undefined;
                if (resolved !== item.startTime) onBlurTime(item.id, resolved);
              }}
            />
          </div>
          <div className="a-tl-time-field">
            <span className="a-tl-field-lbl">Duration</span>
            <div className="a-tl-dur-wrap">
              <input
                type="number"
                className="a-tl-dur-input"
                placeholder="—"
                defaultValue={item.durationMinutes != null ? String(item.durationMinutes) : ''}
                min={1}
                title="Duration in minutes"
                onBlur={e => {
                  const n = parseInt(e.target.value, 10);
                  const resolved = isNaN(n) ? undefined : n;
                  if (resolved !== item.durationMinutes) onBlurDuration(item.id, resolved);
                }}
              />
              <span className="a-tl-dur-suffix">min</span>
            </div>
          </div>
        </div>

        {warnings.includes('gap') && <span className="a-tl-warn">gap</span>}
        {warnings.includes('overlap') && <span className="a-tl-warn">overlap</span>}
        {warnings.includes('missing-duration') && <span className="a-tl-warn">no duration</span>}

        <button className="a-tl-del" type="button" title="Remove" onClick={() => onDelete(item.id)}>
          <TrashIcon />
        </button>
      </div>
    </>
  );
}

// ─── Inline add form ───────────────────────────────────────────────────────────

interface AddFormProps {
  form: AddFormState;
  onChange: (patch: Partial<AddFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  eventArtists: BookedArtist[];
}

function AddForm({ form, onChange, onSubmit, onCancel, saving, eventArtists }: AddFormProps) {
  const isCollabReady = form.type === 'collab_set' && form.collaboratorIds.length >= 2;
  const isSubmitDisabled = saving || (
    form.type === 'artist_set'  ? !form.eventArtistId :
    form.type === 'collab_set'  ? !isCollabReady :
    !form.title.trim()
  );

  return (
    <div className="a-tl-add-form">
      <div className="a-tl-type-btns">
        {ALL_TYPES.map(t => {
          const meta = TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              className={`a-tl-type-btn${form.type === t ? ' is-on' : ''}`}
              style={form.type === t ? { background: meta.bg, color: meta.color, borderColor: 'transparent' } : undefined}
              onClick={() => onChange({ type: t, eventArtistId: '', collaboratorIds: [], title: '' })}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {form.type === 'collab_set' ? (
        <div className="a-tl-collab-section">
          <div className="a-tl-collab-hint">
            Select 2+ artists performing together
          </div>
          <div className="a-tl-collab-select">
            {eventArtists.map(ea => {
              const checked = form.collaboratorIds.includes(ea.id);
              return (
                <label key={ea.id} className="a-tl-collab-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...form.collaboratorIds, ea.id]
                        : form.collaboratorIds.filter(id => id !== ea.id);
                      const names = eventArtists
                        .filter(a => next.includes(a.id))
                        .map(a => a.artist.name);
                      onChange({ collaboratorIds: next, title: names.join(' & ') });
                    }}
                  />
                  {ea.artist.name}
                </label>
              );
            })}
          </div>
          {form.title && (
            <div className="a-tl-collab-preview">{form.title}</div>
          )}
        </div>
      ) : (
        <div className="a-tl-add-form-row">
          <input
            type="text"
            placeholder="Slot title…"
            value={form.title}
            onChange={e => onChange({ title: e.target.value })}
            style={{ flex: 1 }}
            autoFocus
          />
        </div>
      )}

      <div className="a-tl-add-form-row">
        <div className="a-tl-time-field">
          <span className="a-tl-field-lbl">Start</span>
          <input
            type="text"
            placeholder="HH:MM"
            value={form.startTime}
            onChange={e => onChange({ startTime: e.target.value })}
            style={{ width: 64 }}
          />
        </div>
        <div className="a-tl-time-field">
          <span className="a-tl-field-lbl">Duration</span>
          <div className="a-tl-dur-wrap">
            <input
              type="number"
              placeholder="—"
              value={form.durationMinutes}
              onChange={e => onChange({ durationMinutes: e.target.value })}
              min={1}
              style={{ width: 56 }}
            />
            <span className="a-tl-dur-suffix">min</span>
          </div>
        </div>
      </div>

      <div className="a-tl-add-actions">
        <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="a-btn a-btn-primary a-btn-sm"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
        >
          {saving ? 'Adding…' : 'Add slot'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function TimelineEditor({ eventId, eventArtists, initialTimeline }: Props) {
  const [items, setItems] = useState<TimelineItem[]>(initialTimeline);
  const [addForm, setAddForm] = useState<AddFormState | null>(null);
  const [saving, setSaving] = useState(false);

  // Booking drag state
  const [draggingBooking, setDraggingBooking] = useState<BookedArtist | null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const derived = deriveTimeline(items);
  const runtime = totalRuntime(items);

  const placedArtistIds = new Set(items.filter(i => i.eventArtistId).map(i => i.eventArtistId!));
  const placedCollabIds = new Set(
    items.flatMap(i =>
      i.type === 'collab_set' && i.collaborators
        ? i.collaborators.map(c => c.id)
        : []
    )
  );
  const unplacedArtists = eventArtists.filter(ea => !placedArtistIds.has(ea.id) && !placedCollabIds.has(ea.id));

  // ── Drag start ─────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    if (activeId.startsWith('booking-')) {
      const eaId = activeId.replace('booking-', '');
      setDraggingBooking(eventArtists.find(ea => ea.id === eaId) ?? null);
    }
  }, [eventArtists]);

  // ── Drag over ──────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!String(event.active.id).startsWith('booking-')) return;
    const overId = event.over ? String(event.over.id) : null;
    if (overId === APPEND_ZONE_ID) {
      setDropBeforeId(APPEND_ZONE_ID);
    } else if (overId && items.some(i => i.id === overId)) {
      setDropBeforeId(overId);
    } else {
      setDropBeforeId(null);
    }
  }, [items]);

  // ── Drag end ───────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);

    // ── Booking chip dropped onto timeline ─────────────────────────────────
    if (activeId.startsWith('booking-')) {
      const booking = draggingBooking;
      setDraggingBooking(null);
      setDropBeforeId(null);
      if (!booking) return;

      setSaving(true);
      const { data: newItem } = await apiService.addTimelineItem(eventId, {
        type: 'artist_set',
        eventArtistId: booking.id,
      });
      setSaving(false);
      if (!newItem) return;

      setItems(prev => {
        const overId = over ? String(over.id) : null;
        const overIndex = (overId && overId !== APPEND_ZONE_ID)
          ? prev.findIndex(i => i.id === overId)
          : -1;
        if (overIndex < 0) {
          return [...prev, { ...newItem, position: prev.length + 1 }];
        }
        const spliced = [
          ...prev.slice(0, overIndex),
          newItem,
          ...prev.slice(overIndex),
        ].map((i, idx) => ({ ...i, position: idx + 1 }));
        void apiService.reorderTimeline(eventId, spliced.map(i => ({ id: i.id, position: i.position })));
        return spliced;
      });
      return;
    }

    // ── Timeline item reorder ──────────────────────────────────────────────
    setDraggingBooking(null);
    setDropBeforeId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item, position: idx + 1,
    }));

    const prev = items;
    setItems(reordered);
    const { error } = await apiService.reorderTimeline(
      eventId,
      reordered.map(i => ({ id: i.id, position: i.position }))
    );
    if (error) setItems(prev);
  }, [items, eventId, draggingBooking]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    const prev = items;
    const next = prev
      .filter(i => i.id !== id)
      .map((i, idx) => ({ ...i, position: idx + 1 }));
    setItems(next);
    const { error } = await apiService.deleteTimelineItem(eventId, id);
    if (error) setItems(prev);
  }, [items, eventId]);

  // ── Inline time/duration edits ─────────────────────────────────────────────

  const handleBlurTime = useCallback(async (id: string, startTime: string | undefined) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, startTime } : i));
    await apiService.updateTimelineItem(eventId, id, { startTime });
  }, [eventId]);

  const handleBlurDuration = useCallback(async (id: string, durationMinutes: number | undefined) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, durationMinutes } : i));
    await apiService.updateTimelineItem(eventId, id, { durationMinutes });
  }, [eventId]);

  // ── Add slot (+ button flow) ───────────────────────────────────────────────

  function openAddForm(afterPosition: number) {
    let autoStartTime = '';
    if (afterPosition > 0) {
      const prev = derived[afterPosition - 1];
      if (prev.effectiveStart && prev.item.durationMinutes != null) {
        autoStartTime = minutesToTime(timeToMinutes(prev.effectiveStart) + prev.item.durationMinutes);
      } else if (prev.effectiveStart) {
        autoStartTime = prev.effectiveStart;
      }
    }
    setAddForm({
      afterPosition,
      type: 'break',
      title: '',
      eventArtistId: '',
      startTime: autoStartTime,
      durationMinutes: '',
      collaboratorIds: [],
    });
  }

  async function submitAdd() {
    if (!addForm) return;
    setSaving(true);

    const payload: Parameters<typeof apiService.addTimelineItem>[1] = {
      type: addForm.type,
      startTime: addForm.startTime || undefined,
      durationMinutes: addForm.durationMinutes ? parseInt(addForm.durationMinutes, 10) : undefined,
    };

    if (addForm.type === 'collab_set') {
      payload.collaboratorIds = addForm.collaboratorIds;
    } else {
      payload.title = addForm.title.trim();
    }

    const { data: newItem, error } = await apiService.addTimelineItem(eventId, payload);
    if (error || !newItem) { setSaving(false); return; }

    const insertAfter = addForm.afterPosition;
    if (insertAfter >= items.length) {
      setItems([...items, newItem]);
    } else {
      const spliced = [
        ...items.slice(0, insertAfter),
        newItem,
        ...items.slice(insertAfter),
      ].map((i, idx) => ({ ...i, position: idx + 1 }));
      setItems(spliced);
      await apiService.reorderTimeline(eventId, spliced.map(i => ({ id: i.id, position: i.position })));
    }

    setAddForm(null);
    setSaving(false);
  }

  // ── Warnings summary ───────────────────────────────────────────────────────

  const allWarnings = derived.flatMap(d => d.warnings);
  const gapCount = allWarnings.filter(w => w === 'gap').length;
  const overlapCount = allWarnings.filter(w => w === 'overlap').length;
  const missingDurCount = allWarnings.filter(w => w === 'missing-duration').length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="a-tl">
        {/* Unplaced artist bookings — draggable */}
        {unplacedArtists.length > 0 && (
          <div className="a-tl-bookings">
            <div className="a-tl-bookings-label">Booked — drag onto timeline</div>
            <div className="a-tl-bookings-chips">
              {unplacedArtists.map(ea => (
                <DraggableBookingChip key={ea.id} ea={ea} />
              ))}
            </div>
          </div>
        )}

        {/* Timeline list */}
        <div className="a-tl-list">
          {/* Top + button (hidden while dragging a booking) */}
          {!draggingBooking && (
            addForm?.afterPosition === 0
              ? <AddForm
                  form={addForm}
                  onChange={p => setAddForm(f => f ? { ...f, ...p } : f)}
                  onSubmit={submitAdd}
                  onCancel={() => setAddForm(null)}
                  saving={saving}
                  eventArtists={eventArtists}
                />
              : <div className="a-tl-add-row">
                  <button className="a-tl-add-btn" type="button" onClick={() => openAddForm(0)}>+</button>
                </div>
          )}

          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <React.Fragment key={item.id}>
                <SortableItem
                  derived={derived[idx]}
                  isDropTarget={draggingBooking !== null && dropBeforeId === item.id}
                  onDelete={handleDelete}
                  onBlurTime={handleBlurTime}
                  onBlurDuration={handleBlurDuration}
                />
                {/* + button between items (hidden while dragging a booking) */}
                {!draggingBooking && (
                  addForm?.afterPosition === idx + 1
                    ? <AddForm
                        form={addForm}
                        onChange={p => setAddForm(f => f ? { ...f, ...p } : f)}
                        onSubmit={submitAdd}
                        onCancel={() => setAddForm(null)}
                        saving={saving}
                        eventArtists={eventArtists}
                      />
                    : <div className="a-tl-add-row">
                        <button
                          className="a-tl-add-btn"
                          type="button"
                          onClick={() => openAddForm(idx + 1)}
                        >
                          +
                        </button>
                      </div>
                )}
              </React.Fragment>
            ))}
          </SortableContext>

          {/* Append drop zone — always rendered when dragging a booking so the user can drop after the last item */}
          {draggingBooking && (
            <>
              {dropBeforeId === APPEND_ZONE_ID && <div className="a-tl-drop-line" />}
              <AppendDropZone />
            </>
          )}

          {items.length === 0 && !addForm && !draggingBooking && (
            <div className="a-tl-empty">No slots yet — add the first one above.</div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="a-tl-footer">
            <span>Total: {runtime > 0 ? formatDuration(runtime) : '—'}</span>
            <div className="a-tl-footer-warnings">
              {gapCount > 0 && <span className="a-tl-warn">{gapCount} gap{gapCount > 1 ? 's' : ''}</span>}
              {overlapCount > 0 && <span className="a-tl-warn">{overlapCount} overlap{overlapCount > 1 ? 's' : ''}</span>}
              {missingDurCount > 0 && <span className="a-tl-warn">{missingDurCount} without duration</span>}
            </div>
          </div>
        )}
      </div>

      {/* Floating drag preview */}
      <DragOverlay dropAnimation={null}>
        {draggingBooking && (
          <div className="a-tl-booking-chip a-tl-drag-overlay">
            <div className="a-tl-booking-chip-placeholder" />
            {draggingBooking.artist.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
