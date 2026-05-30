import { Event } from '../models/Event';
import { BaseRepository } from './BaseRepository';

/**
 * Aggregate-count queries for the home page. These are pure COUNT statements
 * across several tables, so they stay raw SQL rather than being forced into the
 * ORM. BaseRepository<Event> is used only for a query handle.
 *
 * Indexes used:
 *   countBookableArtists / countDistinctGenres — IDX_artist_isBookable partial index
 */
export class StatsRepository extends BaseRepository<Event> {
  constructor() {
    super(Event);
  }

  async countEvents(): Promise<number> {
    const [{ eventCount }] = await this.repository.query(`SELECT COUNT(*)::int AS "eventCount" FROM event`);
    return eventCount;
  }

  async countVenues(): Promise<number> {
    const [{ venueCount }] = await this.repository.query(`SELECT COUNT(*)::int AS "venueCount" FROM venue`);
    return venueCount;
  }

  async countBookableArtists(): Promise<number> {
    const [{ bookableArtistCount }] = await this.repository.query(
      `SELECT COUNT(*)::int AS "bookableArtistCount" FROM artist WHERE "isBookable" = true`
    );
    return bookableArtistCount;
  }

  async countDistinctGenres(): Promise<number> {
    const [{ genreCount }] = await this.repository.query(
      `SELECT COUNT(DISTINCT genre)::int AS "genreCount" FROM artist WHERE "isBookable" = true AND genre IS NOT NULL`
    );
    return genreCount;
  }

  async countEventArtists(): Promise<number> {
    const [{ totalEventArtists }] = await this.repository.query(
      `SELECT COUNT(*)::int AS "totalEventArtists" FROM event_artist`
    );
    return totalEventArtists;
  }
}
