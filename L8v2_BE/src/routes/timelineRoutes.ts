import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { EventTimelineItem, TimelineItemType } from '../models/EventTimelineItem';
import { EventArtist } from '../models/EventArtist';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const timelineRepo = () => AppDataSource.getRepository(EventTimelineItem);
const eventArtistRepo = () => AppDataSource.getRepository(EventArtist);

const VALID_TYPES: TimelineItemType[] = ['artist_set', 'break', 'dj_set', 'talk', 'custom'];

// GET /api/timeline/:eventId
const getTimeline: RequestHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const rows = await AppDataSource.query(
      `SELECT
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
         artist_image_url   AS "artistImageUrl"
       FROM event_running_order
       WHERE event_id = $1
       ORDER BY position`,
      [eventId]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Error fetching timeline' });
  }
};

// POST /api/timeline/:eventId
const addItem: RequestHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, title, eventArtistId, startTime, durationMinutes, notes } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    if (type === 'artist_set' && !eventArtistId) {
      return res.status(400).json({ message: 'eventArtistId is required for artist_set items' });
    }
    if (type !== 'artist_set' && eventArtistId) {
      return res.status(400).json({ message: 'eventArtistId must be null for non-artist_set items' });
    }

    let resolvedTitle = title;
    if (type === 'artist_set') {
      // Validate eventArtistId belongs to this event and snapshot the artist name
      const ea = await eventArtistRepo().findOne({
        where: { id: eventArtistId, event: { id: eventId } },
        relations: ['artist'],
      });
      if (!ea) {
        return res.status(400).json({ message: 'eventArtistId not found for this event' });
      }
      resolvedTitle = title || ea.artist.name;
    }

    if (!resolvedTitle || !resolvedTitle.trim()) {
      return res.status(400).json({ message: 'title is required' });
    }

    const [{ max }] = await AppDataSource.query(
      `SELECT COALESCE(MAX(position), 0) AS max FROM event_timeline_item WHERE event_id = $1`,
      [eventId]
    );

    const item = timelineRepo().create({
      eventId,
      position: parseInt(max, 10) + 1,
      type,
      title: resolvedTitle.trim(),
      eventArtistId: type === 'artist_set' ? eventArtistId : undefined,
      startTime: startTime || undefined,
      durationMinutes: durationMinutes || undefined,
      notes: notes || undefined,
    });

    const saved = await timelineRepo().save(item);
    res.status(201).json(saved);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error adding timeline item', error: msg });
  }
};

// PUT /api/timeline/:eventId/reorder
const reorderItems: RequestHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { items } = req.body as { items: { id: string; position: number }[] };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    // Validate all items belong to this event
    const existing = await timelineRepo().findBy({ eventId });
    const existingIds = new Set(existing.map(i => i.id));
    const invalid = items.filter(i => !existingIds.has(i.id));
    if (invalid.length > 0) {
      return res.status(400).json({ message: 'Some item IDs do not belong to this event' });
    }

    // Two-phase update to avoid UNIQUE collisions on (event_id, position):
    // phase 1 offsets all current positions out of range,
    // phase 2 assigns the final positions one by one.
    await AppDataSource.transaction(async manager => {
      await manager.query(
        `UPDATE "event_timeline_item" SET "position" = "position" + 100000 WHERE "event_id" = $1`,
        [eventId]
      );
      for (const { id, position } of items) {
        await manager.update(EventTimelineItem, { id }, { position });
      }
    });

    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error reordering timeline', error: msg });
  }
};

// PATCH /api/timeline/:eventId/items/:itemId
const updateItem: RequestHandler = async (req, res) => {
  try {
    const { eventId, itemId } = req.params;
    const { title, startTime, durationMinutes, notes } = req.body;

    const item = await timelineRepo().findOneBy({ id: itemId, eventId });
    if (!item) {
      return res.status(404).json({ message: 'Timeline item not found' });
    }

    if (title !== undefined) item.title = title;
    if (startTime !== undefined) item.startTime = startTime || undefined;
    if (durationMinutes !== undefined) item.durationMinutes = durationMinutes || undefined;
    if (notes !== undefined) item.notes = notes || undefined;

    const saved = await timelineRepo().save(item);
    res.json(saved);
  } catch {
    res.status(500).json({ message: 'Error updating timeline item' });
  }
};

// DELETE /api/timeline/:eventId/items/:itemId
const deleteItem: RequestHandler = async (req, res) => {
  try {
    const { eventId, itemId } = req.params;

    const item = await timelineRepo().findOneBy({ id: itemId, eventId });
    if (!item) {
      return res.status(404).json({ message: 'Timeline item not found' });
    }

    await timelineRepo().remove(item);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting timeline item' });
  }
};

router.get('/:eventId', getTimeline);
router.post('/:eventId', authenticateJWT, addItem);
router.put('/:eventId/reorder', authenticateJWT, reorderItems);
router.patch('/:eventId/items/:itemId', authenticateJWT, updateItem);
router.delete('/:eventId/items/:itemId', authenticateJWT, deleteItem);

export default router;
