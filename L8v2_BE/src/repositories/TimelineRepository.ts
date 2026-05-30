import { EntityManager } from 'typeorm';
import { EventTimelineItem } from '../models/EventTimelineItem';
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

  /**
   * Deletes all timeline items for an event. Accepts an optional EntityManager
   * so the delete can participate in a caller's transaction (e.g. event cascade).
   */
  async deleteByEvent(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(EventTimelineItem) : this.repository;
    await repo.delete({ eventId });
  }
}
