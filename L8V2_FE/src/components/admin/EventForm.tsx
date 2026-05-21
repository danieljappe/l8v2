import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Event, Artist, Venue } from '../../types/admin';

interface EventDraft {
  title: string; description: string; date: string; time: string; endTime: string;
  venue: string; artists: string[]; price: number; capacity: number;
  image: string; billettoURL: string; status: Event['status'];
}

export const emptyEventDraft: EventDraft = {
  title: '', description: '', date: '', time: '', endTime: '',
  venue: '', artists: [], price: 0, capacity: 0,
  image: '', billettoURL: import.meta.env.DEV ? 'https://billetto.dk/e/test-event-123456' : '', status: 'upcoming',
};

interface EventFormProps {
  event?: Event | null;
  onSubmit: (eventData: Omit<Event, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  artists: Artist[];
  venues: Venue[];
  onRemoveArtist?: (eventId: string, artistId: string) => void;
  onAddArtistToEvent?: (eventId: string, artistId: string) => void;
  draft?: EventDraft;
  onDraftChange?: (draft: EventDraft) => void;
}

// ── Artist combobox ────────────────────────────────────────────────
interface ArtistComboboxProps {
  value: string[];             // selected IDs (for new event)
  onChange: (ids: string[]) => void;
  artists: Artist[];
  // For editing an existing event — live add/remove
  eventArtists?: { id: string; artist: { id: string; name: string } }[];
  onAddArtist?: (artistId: string) => void;
  onRemoveArtist?: (artistId: string) => void;
  isEditing: boolean;
}

function ArtistCombobox({ value, onChange, artists, eventArtists, onAddArtist, onRemoveArtist, isEditing }: ArtistComboboxProps) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // When editing: selected = eventArtists; when creating: selected = value array
  const selectedIds = isEditing
    ? (eventArtists?.map(ea => ea.artist.id) ?? [])
    : value;

  const filtered = artists.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
  const selectedSet = new Set(selectedIds);

  function add(artistId: string) {
    if (selectedSet.has(artistId)) return;
    if (isEditing) {
      onAddArtist?.(artistId);
    } else {
      onChange([...value, artistId]);
    }
    setQ('');
    inputRef.current?.focus();
  }

  function remove(artistId: string) {
    if (isEditing) {
      onRemoveArtist?.(artistId);
    } else {
      onChange(value.filter(id => id !== artistId));
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[activeIdx];
      if (target) add(target.id);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Backspace' && q === '' && selectedIds.length > 0) {
      remove(selectedIds[selectedIds.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Display items: when editing use eventArtists names; when creating look up from artists
  const displayItems = isEditing
    ? (eventArtists ?? []).map(ea => ({ id: ea.artist.id, name: ea.artist.name }))
    : artists.filter(a => value.includes(a.id)).map(a => ({ id: a.id, name: a.name }));

  return (
    <div className="a-combo" ref={ref}>
      <div
        className={`a-combo-input${open ? ' is-focus' : ''}`}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {displayItems.map(item => (
          <span className="a-chip-sel" key={item.id}>
            {item.name}
            <button type="button" onClick={e => { e.stopPropagation(); remove(item.id); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={selectedIds.length === 0 ? 'Type to search artists…' : 'Add another…'}
        />
      </div>
      {open && (
        <div className="a-combo-pop">
          {filtered.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: 12.5, color: 'var(--ink-3)' }}>
              No artists match "{q}".
            </div>
          ) : filtered.map((a, i) => {
            const sel = selectedSet.has(a.id);
            return (
              <div
                key={a.id}
                className={`a-combo-opt${i === activeIdx ? ' is-active' : ''}${sel ? ' is-selected' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => sel ? remove(a.id) : add(a.id)}
              >
                <span>{a.name} {a.genre && <span className="g">· {a.genre}</span>}</span>
                {sel && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function EventForm({ event, onSubmit, onCancel, artists, venues, onRemoveArtist, onAddArtistToEvent, draft, onDraftChange }: EventFormProps) {
  const isEditing = !!event;

  // Edit mode uses internal state (always re-initializes from event).
  // Create mode uses controlled draft from parent so it persists across closes.
  const [internalForm, setInternalForm] = useState<EventDraft>(emptyEventDraft);
  const form = isEditing ? internalForm : (draft ?? emptyEventDraft);

  useEffect(() => {
    if (event) {
      setInternalForm({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        endTime: event.endTime || '',
        artists: event.artists ?? [],
        venue: event.venue || '',
        price: event.price,
        capacity: event.capacity,
        image: event.image,
        billettoURL: event.billettoURL || '',
        status: event.status,
      });
    }
  }, [event]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const set = useCallback(<K extends keyof EventDraft>(field: K, val: EventDraft[K]) => {
    if (isEditing) {
      setInternalForm(f => ({ ...f, [field]: val }));
    } else {
      onDraftChange?.({ ...form, [field]: val });
    }
  }, [isEditing, form, onDraftChange]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      artist: form.artists.join(','),
      venue: form.venue,
      imageUrl: form.image,
      billettoURL: form.billettoURL,
    });
  }

  const handleAddArtist = useCallback((artistId: string) => {
    if (event && onAddArtistToEvent) {
      const existing = event.eventArtists?.some(ea => ea.artist.id === artistId);
      if (!existing) {
        onAddArtistToEvent(event.id, artistId);
      }
    }
  }, [event, onAddArtistToEvent]);

  const handleRemoveArtist = useCallback((artistId: string) => {
    if (event && onRemoveArtist) {
      onRemoveArtist(event.id, artistId);
    }
  }, [event, onRemoveArtist]);

  const isValid = form.title.trim().length > 0 && form.date.length > 0;

  return (
    <>
      <div className="a-scrim" onClick={onCancel} />
      <div className="a-drawer-shell">
        <div className="a-drawer-card">
          {/* Header */}
          <div className="a-form-head">
            <div className="a-form-head-l">
              <button className="a-btn a-btn-ghost a-btn-icon" type="button" onClick={onCancel}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              <div>
                <div className="crumb">Events / {isEditing ? 'Edit' : 'New'}</div>
                <h3>{isEditing ? (event.title || 'Edit event') : 'New event'}</h3>
              </div>
            </div>
            <div className="a-form-head-r">
              <span className="a-kbd">Esc</span>
            </div>
          </div>

          {/* Body */}
          <form className="a-form-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="a-form-grid">
              {/* Title */}
              <div className="a-field full a-field-title">
                <label>Event title <span className="req">*</span></label>
                <input
                  className="a-input"
                  placeholder="e.g. Olivver — Album Release"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  autoFocus
                />
              </div>

              {/* Artists */}
              <div className="a-field full">
                <label>Artists</label>
                <ArtistCombobox
                  value={form.artists}
                  onChange={ids => set('artists', ids)}
                  artists={artists}
                  eventArtists={event?.eventArtists}
                  onAddArtist={handleAddArtist}
                  onRemoveArtist={handleRemoveArtist}
                  isEditing={isEditing}
                />
                <span className="hint">Type to filter. Click to add or remove.</span>
              </div>

              {/* Schedule */}
              <div className="a-field full">
                <label>Schedule <span className="req">*</span></label>
                <div className="a-dt-pair">
                  <input
                    type="date"
                    className="a-input"
                    value={form.date}
                    onChange={e => set('date', e.target.value)}
                  />
                  <input
                    type="time"
                    className="a-input"
                    value={form.time}
                    onChange={e => set('time', e.target.value)}
                  />
                  <input
                    type="time"
                    className="a-input"
                    placeholder="End"
                    value={form.endTime}
                    onChange={e => set('endTime', e.target.value)}
                  />
                </div>
                <span className="hint">Start time — end time is optional.</span>
              </div>

              {/* Venue */}
              <div className="a-field">
                <label>Venue <span className="req">*</span></label>
                <select
                  className="a-select"
                  value={form.venue}
                  onChange={e => set('venue', e.target.value)}
                >
                  <option value="">Select venue…</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}{v.city ? ` — ${v.city}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="a-field">
                <label>Status</label>
                <div className="a-seg">
                  {(['upcoming', 'ongoing', 'completed', 'cancelled'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      className={form.status === s ? 'is-on' : ''}
                      onClick={() => set('status', s)}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="a-field full">
                <label>Description</label>
                <textarea
                  className="a-textarea"
                  rows={4}
                  placeholder="Doors, supports, set times, special notes…"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </div>

              {/* Image URL */}
              <div className="a-field full">
                <label>Poster image URL</label>
                <input
                  className="a-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                  placeholder="https://…"
                  value={form.image}
                  onChange={e => set('image', e.target.value)}
                />
              </div>

              {/* Billetto */}
              <div className="a-field full">
                <label>Billetto URL</label>
                <input
                  className="a-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                  placeholder="https://billetto.dk/events/…"
                  value={form.billettoURL}
                  onChange={e => set('billettoURL', e.target.value)}
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="a-form-foot">
            <span className="hint">
              {isEditing ? 'Edit details and save.' : 'Required: title and date.'}
            </span>
            <div className="a-form-foot-r">
              <button type="button" className="a-btn a-btn-ghost" onClick={onCancel}>Cancel</button>
              <button
                type="button"
                className="a-btn a-btn-primary"
                disabled={!isValid}
                onClick={handleSubmit as unknown as React.MouseEventHandler}
              >
                {isEditing ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
