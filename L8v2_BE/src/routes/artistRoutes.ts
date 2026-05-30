import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadArtistImage } from '../middleware/uploadMiddleware';
import { ArtistService } from '../services/ArtistService';

const router = Router();
const artistService = new ArtistService();

/**
 * @swagger
 * tags:
 *   - name: Artists
 *     description: Artist management
 */

// Get all artists
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

// Create new artist
const createArtist: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.createArtist(req.body);
    res.status(201).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error creating artist', error: msg });
  }
};

// Update artist
const updateArtist: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.updateArtist(req.params.id, req.body);
    if (!result) {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error updating artist', error: msg });
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
        message: `Cannot delete artist. They are linked to ${result.count} event(s). Remove the artist from all events first.`
      });
      return;
    }
    res.status(204).send();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error deleting artist', error: msg });
  }
};

// Upload artist image
const handleArtistImageUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }
    const imageUrl = `/uploads/artists/${req.file.filename}`;
    res.json({ imageUrl });
  } catch {
    res.status(500).json({ message: 'Error uploading image' });
  }
};

// ─── Embedding management ───────────────────────────────────────────────────

const addEmbedding: RequestHandler = async (req, res) => {
  try {
    const { embedCode } = req.body;
    if (!embedCode) {
      res.status(400).json({ message: 'embedCode is required' });
      return;
    }

    const result = await artistService.addEmbedding(req.params.id, embedCode);
    if (result.status === 'not_found') {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    if (result.status === 'invalid') {
      res.status(400).json({ message: 'Invalid or unsupported platform embed code' });
      return;
    }
    res.status(201).json({ embedding: result.embedding });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error adding embedding', error: msg });
  }
};

const updateEmbedding: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.updateEmbedding(req.params.id, req.params.embeddingId, req.body.embedCode);
    if (result.status === 'artist_not_found') {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    if (result.status === 'embedding_not_found') {
      res.status(404).json({ message: 'Embedding not found' });
      return;
    }
    if (result.status === 'invalid') {
      res.status(400).json({ message: 'Invalid or unsupported platform embed code' });
      return;
    }
    res.json({ embedding: result.embedding });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error updating embedding', error: msg });
  }
};

const deleteEmbedding: RequestHandler = async (req, res) => {
  try {
    const result = await artistService.deleteEmbedding(req.params.id, req.params.embeddingId);
    if (result.status === 'not_found') {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error deleting embedding', error: msg });
  }
};

router.get('/', getAllArtists);
router.post('/', authenticateJWT, createArtist);
router.get('/:id', getArtistById);
router.put('/:id', authenticateJWT, updateArtist);
router.delete('/:id', authenticateJWT, deleteArtist);
router.post('/upload-image', authenticateJWT, uploadArtistImage, handleArtistImageUpload);
router.post('/:id/embeddings', authenticateJWT, addEmbedding);
router.put('/:id/embeddings/:embeddingId', authenticateJWT, updateEmbedding);
router.delete('/:id/embeddings/:embeddingId', authenticateJWT, deleteEmbedding);

export default router;
