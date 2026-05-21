import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

/**
 * GET /api/stats
 * Returns aggregate counts for the home page PinnedShowcase.
 * All 5 queries run in parallel — no ORM relation loading, pure COUNT SQL.
 *
 * Indexes used:
 *   eventCount        — COUNT(*) on event (PK scan)
 *   venueCount        — COUNT(*) on venue (PK scan) — counts all registered venues
 *   bookableArtistCount — COUNT(*) uses IDX_artist_isBookable partial index
 *   genreCount        — IDX_artist_isBookable partial index
 *   totalEventArtists — COUNT(*) on event_artist (PK scan)
 */
const getStats: RequestHandler = async (_req, res) => {
  try {
    const [
      [{ eventCount }],
      [{ venueCount }],
      [{ bookableArtistCount }],
      [{ genreCount }],
      [{ totalEventArtists }]
    ] = await Promise.all([
      AppDataSource.query(`SELECT COUNT(*)::int AS "eventCount" FROM event`),
      AppDataSource.query(`SELECT COUNT(*)::int AS "venueCount" FROM venue`),
      AppDataSource.query(`SELECT COUNT(*)::int AS "bookableArtistCount" FROM artist WHERE "isBookable" = true`),
      AppDataSource.query(`SELECT COUNT(DISTINCT genre)::int AS "genreCount" FROM artist WHERE "isBookable" = true AND genre IS NOT NULL`),
      AppDataSource.query(`SELECT COUNT(*)::int AS "totalEventArtists" FROM event_artist`)
    ]);

    res.json({ eventCount, venueCount, bookableArtistCount, genreCount, totalEventArtists });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

router.get('/', getStats);

export default router;
