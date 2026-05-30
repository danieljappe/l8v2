import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadArtistImage, handleUploadError } from '../middleware/uploadMiddleware';
import { ArtistService } from '../services/ArtistService';

const router = Router();
const artistService = new ArtistService();

/**
 * @swagger
 * tags:
 *   - name: Artists
 *     description: Artist management
 * /api/artists:
 *   get:
 *     summary: Retrieve a list of artists
 *     tags: [Artists]
 *     responses:
 *       200:
 *         description: A list of artists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new artist
 *     tags: [Artists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Artist created
 *       500:
 *         description: Error creating artist
 *
 * /api/artists/{id}:
 *   get:
 *     summary: Get an artist by ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Artist found
 *       404:
 *         description: Artist not found
 *   put:
 *     summary: Update an artist by ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Artist updated
 *       404:
 *         description: Artist not found
 *   delete:
 *     summary: Delete an artist by ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Artist deleted
 *       404:
 *         description: Artist not found
 */

// Get all artists
// Optional query params:
//   ?bookable=true   — only artists where isBookable = true,
//                      uses IDX_artist_isBookable partial index
const getAllArtists: RequestHandler = async (req, res) => {
  try {
    const artists = await artistService.getAllArtists(req.query.bookable === 'true');
    res.json(artists);
  } catch {
    res.status(500).json({ message: 'Error fetching artists' });
  }
};

// Get artist by ID
const getArtistById: RequestHandler = async (req, res) => {
  try {
    const artist = await artistService.getArtistById(req.params.id);
    if (!artist) {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    res.json(artist);
  } catch {
    res.status(500).json({ message: 'Error fetching artist' });
  }
};

// Create artist
const createArtist: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.createArtist(req.body);
    if (result.status === 'save_failed') {
      res.status(500).json({ message: 'Failed to save artist' });
      return;
    }
    if (result.status === 'reload_failed') {
      res.status(500).json({ message: 'Failed to retrieve saved artist' });
      return;
    }
    res.status(201).json(result.artist);
  } catch (error) {
    console.error('Backend: Error creating artist:', error);
    res.status(500).json({ message: 'Error creating artist' });
  }
};

// Update artist
const updateArtist: RequestHandler = async (req, res) => {
  try {
    const updatedArtist = await artistService.updateArtist(req.params.id, req.body);
    if (!updatedArtist) {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    res.json(updatedArtist);
  } catch {
    res.status(500).json({ message: 'Error updating artist' });
  }
};

// Delete artist
const deleteArtist: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.deleteArtist(req.params.id);
    if (result.status === 'not_found') {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    if (result.status === 'linked') {
      res.status(400).json({
        message: 'Cannot delete artist. This artist is associated with events and must be removed from all events first.',
        relatedEvents: result.relatedEvents,
        eventNames: result.eventNames,
        eventIds: result.eventIds,
        details: `Please remove this artist from the following events before deleting: ${result.eventNames}`
      });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting artist:', error);

    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message && error.message.includes('foreign key constraint')) {
      res.status(400).json({
        message: 'Cannot delete artist. This artist is associated with events and must be removed from all events first.',
        details: 'Please remove this artist from all events before deleting.'
      });
      return;
    }

    res.status(500).json({ message: 'Error deleting artist' });
  }
};

// Upload artist image (no DB access — purely file handling)
const handleArtistImageUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' });
    }

    const filePath = `/uploads/artists/${req.file.filename}`;

    res.status(201).json({
      message: 'Artist image uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: filePath
      }
    });
  } catch (error) {
    console.error('Artist image upload error:', error);
    res.status(500).json({ message: 'Error uploading artist image' });
  }
};

// ─── Embedding management ───────────────────────────────────────────────────

const addEmbedding: RequestHandler = async (req, res) => {
  try {
    const { embedCode } = req.body;
    if (!embedCode) {
      return res.status(400).json({ message: 'Embed code is required' });
    }

    const result = await artistService.addEmbedding(req.params.id, embedCode);
    if (result.status === 'not_found') {
      return res.status(404).json({ message: 'Artist not found' });
    }
    if (result.status === 'invalid') {
      return res.status(400).json({ message: result.error });
    }
    if (result.status === 'create_failed') {
      return res.status(400).json({ message: 'Failed to create embedding' });
    }

    res.status(201).json({
      message: 'Embedding added successfully',
      embedding: result.embedding
    });
  } catch (error) {
    console.error('Error adding embedding:', error);
    res.status(500).json({ message: 'Error adding embedding' });
  }
};

const updateEmbedding: RequestHandler = async (req, res) => {
  try {
    const { embedCode } = req.body;
    if (!embedCode) {
      return res.status(400).json({ message: 'Embed code is required' });
    }

    const result = await artistService.updateEmbedding(req.params.id, req.params.embeddingId, embedCode);
    if (result.status === 'not_found') {
      return res.status(404).json({ message: 'Artist not found' });
    }
    if (result.status === 'no_embeddings') {
      return res.status(404).json({ message: 'No embeddings found' });
    }
    if (result.status === 'embedding_not_found') {
      return res.status(404).json({ message: 'Embedding not found' });
    }
    if (result.status === 'invalid') {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Embedding updated successfully',
      embedding: result.embedding
    });
  } catch (error) {
    console.error('Error updating embedding:', error);
    res.status(500).json({ message: 'Error updating embedding' });
  }
};

const deleteEmbedding: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.deleteEmbedding(req.params.id, req.params.embeddingId);
    if (result.status === 'not_found') {
      return res.status(404).json({ message: 'Artist not found' });
    }
    if (result.status === 'no_embeddings') {
      return res.status(404).json({ message: 'No embeddings found' });
    }
    if (result.status === 'embedding_not_found') {
      return res.status(404).json({ message: 'Embedding not found' });
    }

    res.json({ message: 'Embedding deleted successfully' });
  } catch (error) {
    console.error('Error deleting embedding:', error);
    res.status(500).json({ message: 'Error deleting embedding' });
  }
};

router.get('/', getAllArtists);
router.get('/:id', getArtistById);
router.post('/', authenticateJWT, createArtist);
router.post('/upload-image', authenticateJWT, uploadArtistImage, handleUploadError, handleArtistImageUpload);
router.put('/:id', authenticateJWT, updateArtist);
router.delete('/:id', authenticateJWT, deleteArtist);

// Embedding routes
router.post('/:id/embeddings', authenticateJWT, addEmbedding);
router.put('/:id/embeddings/:embeddingId', authenticateJWT, updateEmbedding);
router.delete('/:id/embeddings/:embeddingId', authenticateJWT, deleteEmbedding);

export default router;
