import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Venue } from '../models/Venue';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const venueRepository = AppDataSource.getRepository(Venue);

interface VenueParams {
  id: string;
}

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
    const venues = await venueRepository.find({
      relations: ['events']
    });
    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venues' });
  }
};

// Get venue by ID
const getVenueById: RequestHandler = async (req, res) => {
  try {
    const venue = await venueRepository.findOne({
      where: { id: req.params.id },
      relations: ['events']
    });
    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venue' });
  }
};

// Create venue
const createVenue: RequestHandler = async (req, res) => {
  try {
    const venue = venueRepository.create(req.body);
    const result = await venueRepository.save(venue);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error creating venue' });
  }
};

// Update venue
const updateVenue: RequestHandler = async (req, res) => {
  try {
    const venue = await venueRepository.findOne({
      where: { id: req.params.id },
      relations: ['events']
    });
    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }
    venueRepository.merge(venue, req.body);
    const result = await venueRepository.save(venue);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating venue' });
  }
};

// Delete venue
const deleteVenue: RequestHandler = async (req, res) => {
  try {
    const venue = await venueRepository.findOne({
      where: { id: req.params.id },
      relations: ['events']
    });
    if (!venue) {
      res.status(404).json({ message: 'Venue not found' });
      return;
    }
    await venueRepository.remove(venue);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting venue' });
  }
};

router.get('/', getAllVenues);
router.get('/:id', getVenueById);
router.post('/', authenticateJWT, createVenue);
router.put('/:id', authenticateJWT, updateVenue);
router.delete('/:id', authenticateJWT, deleteVenue);

export default router; 