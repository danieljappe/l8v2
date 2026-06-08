import { Event } from '../models/Event';
import { Venue } from '../models/Venue';
import { BaseRepository } from './BaseRepository';
import { MoreThanOrEqual, LessThan, DeepPartial } from 'typeorm';

// Relations hydrated for the full event response shape (used by list + by-id reads).
const EVENT_RELATIONS = ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages', 'billettoData'];
// First fetch on update omits billettoData (matches the original route behaviour).
const EVENT_UPDATE_RELATIONS = ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages'];

export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super(Event);
  }

  async findAllWithRelations(): Promise<Event[]> {
    return this.repository.find({ relations: EVENT_RELATIONS });
  }

  async findUpcomingWithRelations(take?: number): Promise<Event[]> {
    return this.repository.find({
      where: { date: MoreThanOrEqual(new Date()) },
      relations: EVENT_RELATIONS,
      order: { date: 'ASC' },
      take,
    });
  }

  async findPastWithRelations(take?: number): Promise<Event[]> {
    return this.repository.find({
      where: { date: LessThan(new Date()) },
      relations: EVENT_RELATIONS,
      order: { date: 'DESC' },
      take,
    });
  }

  async findByIdWithRelations(id: string): Promise<Event | null> {
    return this.repository.findOne({ where: { id }, relations: EVENT_RELATIONS });
  }

  async findAvailabilityLabel(eventId: string): Promise<string | null> {
    const rows = await this.repository.query(
      `SELECT "availabilityLabel" FROM event_ticket_availability WHERE "eventId" = $1`,
      [eventId],
    );
    return (rows[0]?.availabilityLabel as string | undefined) ?? null;
  }

  async findAvailabilityLabels(eventIds: string[]): Promise<Map<string, string | null>> {
    if (eventIds.length === 0) return new Map();
    const rows: Array<{ eventId: string; availabilityLabel: string | null }> =
      await this.repository.query(
        `SELECT "eventId", "availabilityLabel" FROM event_ticket_availability WHERE "eventId" = ANY($1)`,
        [eventIds],
      );
    return new Map(rows.map(r => [r.eventId, r.availabilityLabel]));
  }

  /**
   * Merges the patch into the existing event, resets the venue relation when a
   * venueId is supplied (so TypeORM writes the new FK instead of the stale
   * hydrated relation), saves, and refetches with full relations. Returns null
   * if the event does not exist.
   */
  async updateWithRelations(id: string, data: DeepPartial<Event>): Promise<Event | null> {
    const event = await this.repository.findOne({ where: { id }, relations: EVENT_UPDATE_RELATIONS });
    if (!event) return null;

    this.repository.merge(event, data);
    if ('venueId' in data) {
      event.venue = data.venueId ? ({ id: data.venueId } as Venue) : undefined;
    }
    await this.repository.save(event);

    return this.repository.findOne({ where: { id }, relations: EVENT_RELATIONS });
  }
}
