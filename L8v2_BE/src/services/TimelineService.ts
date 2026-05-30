import { TimelineItemType } from '../models/EventTimelineItem';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { EventArtistRepository } from '../repositories/EventArtistRepository';

const VALID_TYPES: TimelineItemType[] = ['artist_set', 'break', 'dj_set', 'talk', 'custom', 'collab_set'];

export type AddItemResult =
  | { status: 'invalid'; message: string }
  | { status: 'created'; item: unknown };

export type ReorderResult =
  | { status: 'invalid'; message: string }
  | { status: 'ok' };

export type UpdateItemResult =
  | { status: 'not_found' }
  | { status: 'updated'; item: unknown };

export type DeleteItemResult =
  | { status: 'not_found' }
  | { status: 'deleted' };

interface AddItemBody {
  type: TimelineItemType;
  title?: string;
  eventArtistId?: string;
  startTime?: string;
  durationMinutes?: number;
  collaboratorIds?: string[];
}

export class TimelineService {
  private timelineRepository: TimelineRepository;
  private eventArtistRepository: EventArtistRepository;

  constructor() {
    this.timelineRepository = new TimelineRepository();
    this.eventArtistRepository = new EventArtistRepository();
  }

  async getTimeline(eventId: string): Promise<unknown[]> {
    return this.timelineRepository.findRunningOrder(eventId);
  }

  async addItem(eventId: string, body: AddItemBody): Promise<AddItemResult> {
    const { type, title, eventArtistId, startTime, durationMinutes, collaboratorIds } = body;

    if (!VALID_TYPES.includes(type)) {
      return { status: 'invalid', message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
    }
    if (type === 'artist_set' && !eventArtistId) {
      return { status: 'invalid', message: 'eventArtistId is required for artist_set items' };
    }
    if (type !== 'artist_set' && eventArtistId) {
      return { status: 'invalid', message: 'eventArtistId must be null for non-artist_set items' };
    }
    if (type === 'collab_set' && (!Array.isArray(collaboratorIds) || collaboratorIds.length < 2)) {
      return { status: 'invalid', message: 'collab_set requires at least 2 collaboratorIds' };
    }

    let resolvedTitle = title;

    if (type === 'artist_set') {
      const ea = await this.eventArtistRepository.findByIdAndEventWithArtist(eventArtistId!, eventId);
      if (!ea) {
        return { status: 'invalid', message: 'eventArtistId not found for this event' };
      }
      resolvedTitle = title || ea.artist.name;
    }

    if (type === 'collab_set') {
      const eas = await Promise.all(
        (collaboratorIds as string[]).map(id => this.eventArtistRepository.findByIdAndEventWithArtist(id, eventId))
      );
      if (eas.some(ea => !ea)) {
        return { status: 'invalid', message: 'One or more collaboratorIds not found for this event' };
      }
      resolvedTitle = title || eas.map(ea => ea!.artist.name).join(' & ');
    }

    if (!resolvedTitle || !resolvedTitle.trim()) {
      return { status: 'invalid', message: 'title is required' };
    }

    const max = await this.timelineRepository.maxPosition(eventId);

    const saved = await this.timelineRepository.createItem({
      eventId,
      position: max + 1,
      type,
      title: resolvedTitle.trim(),
      eventArtistId: type === 'artist_set' ? eventArtistId : undefined,
      startTime: startTime || undefined,
      durationMinutes: durationMinutes || undefined,
    });

    // Populate join table for artist-linked slot types
    if (type === 'artist_set') {
      await this.timelineRepository.addSlotArtist(saved.id, eventArtistId!);
    } else if (type === 'collab_set') {
      for (const eaId of collaboratorIds as string[]) {
        await this.timelineRepository.addSlotArtist(saved.id, eaId);
      }
    }

    // Return full row including collaborators from the view
    const row = await this.timelineRepository.findRunningOrderById(saved.id);
    return { status: 'created', item: row ?? saved };
  }

  async reorderItems(eventId: string, items: { id: string; position: number }[]): Promise<ReorderResult> {
    if (!Array.isArray(items) || items.length === 0) {
      return { status: 'invalid', message: 'items array is required' };
    }

    const existing = await this.timelineRepository.findByEvent(eventId);
    const existingIds = new Set(existing.map(i => i.id));
    if (items.some(i => !existingIds.has(i.id))) {
      return { status: 'invalid', message: 'Some item IDs do not belong to this event' };
    }

    await this.timelineRepository.reorder(eventId, items);
    return { status: 'ok' };
  }

  async updateItem(
    eventId: string,
    itemId: string,
    patch: { title?: string; startTime?: string; durationMinutes?: number; notes?: string }
  ): Promise<UpdateItemResult> {
    const item = await this.timelineRepository.findOneByIdAndEvent(itemId, eventId);
    if (!item) return { status: 'not_found' };

    const { title, startTime, durationMinutes, notes } = patch;
    if (title !== undefined) item.title = title;
    if (startTime !== undefined) item.startTime = startTime || undefined;
    if (durationMinutes !== undefined) item.durationMinutes = durationMinutes || undefined;
    if (notes !== undefined) item.notes = notes || undefined;

    const saved = await this.timelineRepository.saveItem(item);
    return { status: 'updated', item: saved };
  }

  async deleteItem(eventId: string, itemId: string): Promise<DeleteItemResult> {
    const item = await this.timelineRepository.findOneByIdAndEvent(itemId, eventId);
    if (!item) return { status: 'not_found' };

    await this.timelineRepository.removeItem(item);
    return { status: 'deleted' };
  }
}
