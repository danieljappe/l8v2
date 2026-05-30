import { EntityManager, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';
import { EventTimelineItem } from '../models/EventTimelineItem';
import { TimelineSlotArtist } from '../models/TimelineSlotArtist';
import { BaseRepository } from './BaseRepository';

// Columns selected from the event_running_order view (camelCase aliases),
// kept verbatim so the API response shape is preserved.
const RUNNING_ORDER_COLUMNS = `
  id,
  event_id           AS "eventId",
  position,
  start_time         AS "startTime",
  duration_minutes   AS "durationMinutes",
  type,
  title,
  notes,
  event_artist_id    AS "eventArtistId",
  artist_id          AS "artistId",
  artist_name        AS "artistName",
  artist_genre       AS "artistGenre",
  artist_image_url   AS "artistImageUrl",
  collaborators`;

export class TimelineRepository extends BaseRepository<EventTimelineItem> {
  private slotArtistRepository = AppDataSource.getRepository(TimelineSlotArtist);

  constructor() {
    super(EventTimelineItem);
  }

  /**
   * Reads the running order for an event from the event_running_order view.
   * The view is the correct abstraction here, so this stays raw SQL.
   */
  async findRunningOrder(eventId: string): Promise<unknown[]> {
    return this.repository.query(
      `SELECT${RUNNING_ORDER_COLUMNS}
       FROM event_running_order
       WHERE event_id = $1
       ORDER BY position`,
      [eventId]
    );
  }

  /** Reads a single running-order row (e.g. the row just inserted) from the view. */
  async findRunningOrderById(id: string): Promise<unknown | null> {
    const [row] = await this.repository.query(
      `SELECT${RUNNING_ORDER_COLUMNS}
       FROM event_running_order
       WHERE id = $1`,
      [id]
    );
    return row ?? null;
  }

  /** Highest existing position for an event (0 when there are no items). */
  async maxPosition(eventId: string): Promise<number> {
    const [{ max }] = await this.repository.query(
      `SELECT COALESCE(MAX(position), 0) AS max FROM event_timeline_item WHERE event_id = $1`,
      [eventId]
    );
    return parseInt(max, 10);
  }

  async createItem(data: DeepPartial<EventTimelineItem>): Promise<EventTimelineItem> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async saveItem(item: EventTimelineItem): Promise<EventTimelineItem> {
    return this.repository.save(item);
  }

  async removeItem(item: EventTimelineItem): Promise<void> {
    await this.repository.remove(item);
  }

  async findByEvent(eventId: string): Promise<EventTimelineItem[]> {
    return this.repository.findBy({ eventId });
  }

  async findOneByIdAndEvent(itemId: string, eventId: string): Promise<EventTimelineItem | null> {
    return this.repository.findOneBy({ id: itemId, eventId });
  }

  /** Links an event-artist to a timeline slot (collab/artist sets). */
  async addSlotArtist(timelineItemId: string, eventArtistId: string): Promise<void> {
    await this.slotArtistRepository.save(
      this.slotArtistRepository.create({ timelineItemId, eventArtistId })
    );
  }

  /**
   * Reorders items in a single transaction. First bumps all positions by 100000
   * to dodge the UNIQUE(event_id, position) constraint, then writes the targets.
   */
  async reorder(eventId: string, items: { id: string; position: number }[]): Promise<void> {
    await AppDataSource.transaction(async manager => {
      await manager.query(
        `UPDATE "event_timeline_item" SET "position" = "position" + 100000 WHERE "event_id" = $1`,
        [eventId]
      );
      for (const { id, position } of items) {
        await manager.update(EventTimelineItem, { id }, { position });
      }
    });
  }

  /**
   * Deletes all timeline items for an event. Accepts an optional EntityManager
   * so the delete can participate in a caller's transaction (e.g. event cascade).
   */
  async deleteByEvent(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(EventTimelineItem) : this.repository;
    await repo.delete({ eventId });
  }
}
