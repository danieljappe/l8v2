import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { VenueService } from '../services/VenueService';

const router = Router();
const venueService = new VenueService();

/**
 * @swagger
 * tags:
 *   - name: Venues
 *     description: Venue management
 * /api/venues:
 *   get:
 *     summary: Retrieve a list of venues
 *     tags: [Venues]
 *     responses:
 *       200:
 *         description: A list of venues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Venue created
 *       500:
 *         description: Error creating venue
 *
 * /api/venues/{id}:
 *   get:
 *     summary: Get a venue by ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venue found
 *       404:
 *         description: Venue not found
 *   put:
 *     summary: Update a venue by ID
 *     tags: [Venues]
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
 *         description: Venue updated
 *       404:
 *         description: Venue not found
 *   delete:
 *     summary: Delete a venue by ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Venue deleted
 *       404:
 *         description: Venue not found
 */

// Get all venues
const getAllVenues: RequestHandler = async (_req, res) => {
  try {
    const venues = await venueService.getAllVenues();
    res.json(venues);
  } catch {
    res.status(500).json({ message: 'Error fetching venues' });
  }
};

// Get venue by ID
const getVenueById: RequestHandler = async (req, res) => {
  try {
    const venue = await venueService.getVenueById(req.params.id);
    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }
    res.json(venue);
  } catch {
    res.status(500).json({ message: 'Error fetching venue' });
  }
};

// Create venue
const createVenue: RequestHandler = async (req, res) => {
  try {
    const result = await venueService.createVenue(req.body);
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: 'Error creating venue' });
  }
};

// Update venue
const updateVenue: RequestHandler = async (req, res) => {
  try {
    const result = await venueService.updateVenue(req.params.id, req.body);
    if (!result) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Error updating venue' });
  }
};

// Delete venue
const deleteVenue: RequestHandler = async (req, res) => {
  try {
    const deleted = await venueService.deleteVenue(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting venue' });
  }
};

router.get('/', getAllVenues);
router.get('/:id', getVenueById);
router.post('/', authenticateJWT, createVenue);
router.put('/:id', authenticateJWT, updateVenue);
router.delete('/:id', authenticateJWT, deleteVenue);

export default router;
