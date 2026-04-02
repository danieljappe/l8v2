import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { authenticateJWT } from '../middleware/authMiddleware';
import { slugify } from '../utils/slugUtils';

const router = Router();
const eventRepository = AppDataSource.getRepository(Event);

interface EventParams {
  id: string;
}

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
const getAllEvents: RequestHandler = async (_req, res) => {
  try {
    const events = await eventRepository.find({
      relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages']
    });
    res.json(events);
  } catch (error) {
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
        relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages']
      });
    }

    // If not found by ID, try to find by slugified title
    if (!event) {
      // Get all events to match by slugified title
      const allEvents = await eventRepository.find({
        relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages']
      });
      
      // Find event where slugified title matches the identifier
      event = allEvents.find(e => slugify(e.title) === identifier) || null;
    }
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
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
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      message: 'Error creating event', 
      error: error.message,
      details: error.detail || error.code
    });
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
    await eventRepository.save(event);
    
    // Refetch the event with relations to ensure all data is populated
    const updatedEvent = await eventRepository.findOne({
      where: { id: req.params.id },
      relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages']
    });
    
    res.json(updatedEvent);
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

// Delete event
const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const event = await eventRepository.findOne({
      where: { id: req.params.id },
      relations: ['venue', 'eventArtists', 'eventArtists.artist', 'galleryImages']
    });
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    await eventRepository.remove(event);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', authenticateJWT, createEvent);
router.put('/:id', authenticateJWT, updateEvent);
router.delete('/:id', authenticateJWT, deleteEvent);

export default router; 