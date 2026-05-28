import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { EventArtist } from '../models/EventArtist';
import { EventTimelineItem } from '../models/EventTimelineItem';
import { GalleryImage } from '../models/GalleryImage';
import { BillettoEventData } from '../models/BillettoEventData';
import { authenticateJWT } from '../middleware/authMiddleware';
import { slugify } from '../utils/slugUtils';
import { MoreThanOrEqual, LessThan } from 'typeorm';

const router = Router();
const eventRepository = AppDataSource.getRepository(Event);


/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Event management
 * /api/events:
 *   get:
 *     summary: Retrieve a list of events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Event created
 *       500:
 *         description: Error creating event
 *
 * /api/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event found
 *       404:
 *         description: Event not found
 *   put:
 *     summary: Update an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event updated
 *       404:
 *         description: Event not found
 *   delete:
 *     summary: Delete an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Event deleted
 *       404:
 *         description: Event not found
 */

// Get all events
// Optional query params:
//   ?upcoming=true          — only events where date >= now, ordered ASC, uses IDX_event_date_status
//   ?past=true              — only events where date < now, ordered DESC, uses IDX_event_date_status
//   ?limit=N                — max rows returned (intended for use with upcoming/past)
const getAllEvents: RequestHandler = async (req, res) => {
  try {
    const { upcoming, past, limit } = req.query;
    const take = limit ? parseInt(limit as string, 10) : undefined;
    const relations = ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages', 'billettoData'];

    if (upcoming === 'true') {
      const events = await eventRepository.find({
        where: { date: MoreThanOrEqual(new Date()) },
        relations,
        order: { date: 'ASC' },
        take
      });
      res.json(events);
      return;
    }

    if (past === 'true') {
      const events = await eventRepository.find({
        where: { date: LessThan(new Date()) },
        relations,
        order: { date: 'DESC' },
        take
      });
      res.json(events);
      return;
    }

    const events = await eventRepository.find({ relations });
    res.json(events);
  } catch {
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Get event by name (slug) or ID
const getEventById: RequestHandler = async (req, res) => {
  try {
    const identifier = req.params.id;
    
    // Validate that the identifier is provided
    if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
      res.status(400).json({ message: 'Invalid event identifier' });
      return;
    }

    let event: Event | null = null;

    // First, try to find by UUID (backward compatibility)
    // Check if it looks like a UUID (contains hyphens and is 36 characters)
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      event = await eventRepository.findOne({
        where: { id: identifier },
        relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages', 'billettoData']
      });
    }

    // If not found by ID, try to find by slugified title
    if (!event) {
      // Get all events to match by slugified title
      const allEvents = await eventRepository.find({
        relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages', 'billettoData']
      });
      
      // Find event where slugified title matches the identifier
      event = allEvents.find(e => slugify(e.title) === identifier) || null;
    }
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const timeline = await AppDataSource.query(
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
      [event.id]
    );

    res.json({ ...event, timeline });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event' });
  }
};

// Create event
const createEvent: RequestHandler = async (req, res) => {
  try {
    console.log('Creating event with data:', req.body);
    const event = eventRepository.create(req.body);
    const result = await eventRepository.save(event);
    console.log('Event created successfully:', result);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating event:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const detail = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
    res.status(500).json({ message: 'Error creating event', error: msg, details: detail });
  }
};

// Update event
const updateEvent: RequestHandler = async (req, res) => {
  try {
    const event = await eventRepository.findOne({
      where: { id: req.params.id },
      relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages']
    });
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    eventRepository.merge(event, req.body);
    // If venueId was sent, reset the loaded venue object so TypeORM uses the
    // new FK value instead of the stale hydrated relation.
    if ('venueId' in req.body) {
      event.venue = req.body.venueId ? { id: req.body.venueId } as import('../models/Venue').Venue : undefined;
    }
    await eventRepository.save(event);
    
    // Refetch the event with relations to ensure all data is populated
    const updatedEvent = await eventRepository.findOne({
      where: { id: req.params.id },
      relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages', 'billettoData']
    });
    
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Error updating event', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

// Delete event
const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const event = await eventRepository.findOne({ where: { id: req.params.id } });
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    const id = req.params.id;
    // Delete all child records before removing the event (no ON DELETE CASCADE on these FKs)
    await AppDataSource.getRepository(EventTimelineItem).delete({ eventId: id });
    await AppDataSource.getRepository(EventArtist).delete({ event: { id } });
    await AppDataSource.getRepository(GalleryImage).delete({ event: { id } });
    await AppDataSource.getRepository(BillettoEventData).delete({ event: { id } });
    await eventRepository.remove(event);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Error deleting event', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', authenticateJWT, createEvent);
router.put('/:id', authenticateJWT, updateEvent);
router.delete('/:id', authenticateJWT, deleteEvent);

export default router; 