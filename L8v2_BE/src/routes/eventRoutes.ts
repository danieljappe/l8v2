import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { EventService } from '../services/EventService';

const router = Router();
const eventService = new EventService();


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
    const events = await eventService.getAllEvents({
      upcoming: upcoming === 'true',
      past: past === 'true',
      take,
    });
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

    const event = await eventService.getEventByIdentifier(identifier);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event' });
  }
};

// Create event
const createEvent: RequestHandler = async (req, res) => {
  try {
    const result = await eventService.createEvent(req.body);
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
    const updatedEvent = await eventService.updateEvent(req.params.id, req.body);
    if (!updatedEvent) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Error updating event', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

// Delete event
const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const deleted = await eventService.deleteEvent(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
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
