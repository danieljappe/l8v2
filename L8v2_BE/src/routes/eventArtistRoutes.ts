import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { EventArtistService } from '../services/EventArtistService';

const router = Router();
const eventArtistService = new EventArtistService();

/**
 * @swagger
 * tags:
 *   - name: Event-Artists
 *     description: Event-Artist relationship management
 * /api/event-artists:
 *   get:
 *     summary: Retrieve a list of event-artist relationships
 *     tags: [Event-Artists]
 *     responses:
 *       200:
 *         description: A list of event-artist relationships
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new event-artist relationship
 *     tags: [Event-Artists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Event-artist relationship created
 *       500:
 *         description: Error creating event-artist relationship
 *
 * /api/event-artists/{id}:
 *   get:
 *     summary: Get an event-artist relationship by ID
 *     tags: [Event-Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event-artist relationship found
 *       404:
 *         description: Event-artist relationship not found
 *   put:
 *     summary: Update an event-artist relationship by ID
 *     tags: [Event-Artists]
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
 *         description: Event-artist relationship updated
 *       404:
 *         description: Event-artist relationship not found
 *   delete:
 *     summary: Delete an event-artist relationship by ID
 *     tags: [Event-Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Event-artist relationship deleted
 *       404:
 *         description: Event-artist relationship not found
 */

// Get all event artists
const getAllEventArtists: RequestHandler = async (_req, res) => {
  try {
    const eventArtists = await eventArtistService.getAllEventArtists();
    res.json(eventArtists);
  } catch {
    res.status(500).json({ message: 'Error fetching event artists' });
  }
};

// Get event artist by ID
const getEventArtistById: RequestHandler = async (req, res) => {
  try {
    const eventArtist = await eventArtistService.getEventArtistById(req.params.id);
    if (!eventArtist) {
      res.status(404).json({ message: 'Event artist not found' });
      return;
    }
    res.json(eventArtist);
  } catch {
    res.status(500).json({ message: 'Error fetching event artist' });
  }
};

// Create event artist
const createEventArtist: RequestHandler = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.event || !req.body.artist) {
      return res.status(400).json({
        message: 'Missing required fields: event and artist are required',
        received: req.body
      });
    }

    const result = await eventArtistService.createEventArtist(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating event artist:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const detail = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
    res.status(500).json({ message: 'Error creating event artist', error: msg, details: detail });
  }
};

// Update event artist
const updateEventArtist: RequestHandler = async (req, res) => {
  try {
    const result = await eventArtistService.updateEventArtist(req.params.id, req.body);
    if (!result) {
      res.status(404).json({ message: 'Event artist not found' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Error updating event artist' });
  }
};

// Delete event artist
const deleteEventArtist: RequestHandler = async (req, res) => {
  try {
    const deleted = await eventArtistService.deleteEventArtist(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Event artist not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting event artist' });
  }
};

// Remove artist from event
const removeArtistFromEvent: RequestHandler = async (req, res) => {
  try {
    const { eventId, artistId } = req.params;

    const eventArtist = await eventArtistService.removeArtistFromEvent(eventId, artistId);
    if (!eventArtist) {
      return res.status(404).json({
        message: 'Artist not found in this event',
        eventId,
        artistId
      });
    }

    res.json({
      message: `Artist ${eventArtist.artist.name} removed from event ${eventArtist.event.title}`,
      removedArtist: eventArtist.artist.name,
      eventTitle: eventArtist.event.title
    });
  } catch (err) {
    console.error('Error removing artist from event:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const detail = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
    res.status(500).json({ message: 'Error removing artist from event', error: msg, details: detail });
  }
};

router.get('/', getAllEventArtists);
router.get('/:id', getEventArtistById);
router.post('/', authenticateJWT, createEventArtist);
router.put('/:id', authenticateJWT, updateEventArtist);
router.delete('/:id', authenticateJWT, deleteEventArtist);
router.delete('/event/:eventId/artist/:artistId', authenticateJWT, removeArtistFromEvent);

export default router;
