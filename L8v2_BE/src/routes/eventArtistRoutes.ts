import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { EventArtist } from '../models/EventArtist';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const eventArtistRepository = AppDataSource.getRepository(EventArtist);

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
    const eventArtists = await eventArtistRepository.find({
      relations: ['event', 'artist']
    });
    res.json(eventArtists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event artists' });
  }
};

// Get event artist by ID
const getEventArtistById: RequestHandler = async (req, res) => {
  try {
    const eventArtist = await eventArtistRepository.findOne({
      where: { id: req.params.id },
      relations: ['event', 'artist']
    });
    if (!eventArtist) {
      res.status(404).json({ message: 'Event artist not found' });
      return;
    }
    res.json(eventArtist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event artist' });
  }
};

// Create event artist
const createEventArtist: RequestHandler = async (req, res) => {
  try {
    console.log('Creating event artist with data:', req.body);
    
    // Validate required fields
    if (!req.body.event || !req.body.artist) {
      return res.status(400).json({ 
        message: 'Missing required fields: event and artist are required',
        received: req.body 
      });
    }

    const eventArtist = eventArtistRepository.create(req.body);
    const result = await eventArtistRepository.save(eventArtist);
    
    console.log('Event artist created successfully:', result);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating event artist:', error);
    res.status(500).json({ 
      message: 'Error creating event artist', 
      error: error.message,
      details: error.detail || error.code
    });
  }
};

// Update event artist
const updateEventArtist: RequestHandler = async (req, res) => {
  try {
    const eventArtist = await eventArtistRepository.findOne({
      where: { id: req.params.id },
      relations: ['event', 'artist']
    });
    if (!eventArtist) {
      res.status(404).json({ message: 'Event artist not found' });
      return;
    }
    eventArtistRepository.merge(eventArtist, req.body);
    const result = await eventArtistRepository.save(eventArtist);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event artist' });
  }
};

// Delete event artist
const deleteEventArtist: RequestHandler = async (req, res) => {
  try {
    const eventArtist = await eventArtistRepository.findOne({
      where: { id: req.params.id },
      relations: ['event', 'artist']
    });
    if (!eventArtist) {
      res.status(404).json({ message: 'Event artist not found' });
      return;
    }
    await eventArtistRepository.remove(eventArtist);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event artist' });
  }
};

// Remove artist from event
const removeArtistFromEvent: RequestHandler = async (req, res) => {
  try {
    const { eventId, artistId } = req.params;
    console.log('Removing artist from event:', { eventId, artistId });
    
    // Find the EventArtist relationship
    const eventArtist = await eventArtistRepository.findOne({
      where: {
        event: { id: eventId },
        artist: { id: artistId }
      },
      relations: ['event', 'artist']
    });

    if (!eventArtist) {
      console.log('EventArtist relationship not found for:', { eventId, artistId });
      return res.status(404).json({ 
        message: 'Artist not found in this event',
        eventId,
        artistId
      });
    }

    console.log('Found EventArtist relationship:', eventArtist);

    // Remove the relationship
    await eventArtistRepository.remove(eventArtist);
    
    console.log('EventArtist relationship removed successfully');
    
    res.json({ 
      message: `Artist ${eventArtist.artist.name} removed from event ${eventArtist.event.title}`,
      removedArtist: eventArtist.artist.name,
      eventTitle: eventArtist.event.title
    });
  } catch (error: any) {
    console.error('Error removing artist from event:', error);
    res.status(500).json({ 
      message: 'Error removing artist from event',
      error: error.message,
      details: error.detail || error.code
    });
  }
};

router.get('/', getAllEventArtists);
router.get('/:id', getEventArtistById);
router.post('/', authenticateJWT, createEventArtist);
router.put('/:id', authenticateJWT, updateEventArtist);
router.delete('/:id', authenticateJWT, deleteEventArtist);
router.delete('/event/:eventId/artist/:artistId', authenticateJWT, removeArtistFromEvent);

export default router; 