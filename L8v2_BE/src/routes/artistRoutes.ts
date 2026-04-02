import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Artist } from '../models/Artist';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadArtistImage, handleUploadError } from '../middleware/uploadMiddleware';
import { createEmbedding, sanitizeEmbedCode, validateAndSanitizeEmbedding } from '../utils/embeddingUtils';
import path from 'path';
import fs from 'fs';

const router = Router();
const artistRepository = AppDataSource.getRepository(Artist);

interface ArtistParams {
  id: string;
}

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
const getAllArtists: RequestHandler = async (_req, res) => {
  try {
    const artists = await artistRepository.find({
      relations: ['bookingUser']
    });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching artists' });
  }
};

// Get artist by ID
const getArtistById: RequestHandler = async (req, res) => {
  try {
    const artist = await artistRepository.findOne({ 
      where: { id: req.params.id },
      relations: ['bookingUser']
    });
    if (!artist) {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching artist' });
  }
};

// Create artist
const createArtist: RequestHandler = async (req, res) => {
  try {
    console.log('Backend: Creating artist with data:', req.body);
    
    // Process embeddings if provided
    if (req.body.embeddings && Array.isArray(req.body.embeddings)) {
      for (const embedding of req.body.embeddings) {
        // Validate and sanitize each embedding
        const validation = validateAndSanitizeEmbedding(embedding.embedCode);
        if (validation.isValid) {
          embedding.embedCode = sanitizeEmbedCode(validation.sanitizedCode!);
          embedding.platform = validation.platform!;
          embedding.title = validation.title;
          embedding.description = validation.description;
          embedding.thumbnailUrl = validation.thumbnailUrl;
        } else {
          console.warn('Invalid embedding code:', validation.error);
        }
      }
    }
    
    const artist = artistRepository.create(req.body);
    console.log('Backend: Created artist entity:', artist);
    
    // Save returns Artist when passing a single entity
    const saveResult = await artistRepository.save(artist);
    // TypeORM save() can return T or T[], but with single entity it's always T
    const savedArtistEntity = Array.isArray(saveResult) ? saveResult[0] : saveResult;
    
    if (!savedArtistEntity || !savedArtistEntity.id) {
      return res.status(500).json({ message: 'Failed to save artist' });
    }
    
    console.log('Backend: Saved artist result:', savedArtistEntity);
    
    // Reload with relations
    const savedArtist = await artistRepository.findOne({ 
      where: { id: savedArtistEntity.id },
      relations: ['bookingUser']
    });
    
    if (!savedArtist) {
      return res.status(500).json({ message: 'Failed to retrieve saved artist' });
    }
    
    res.status(201).json(savedArtist);
  } catch (error) {
    console.error('Backend: Error creating artist:', error);
    res.status(500).json({ message: 'Error creating artist' });
  }
};

// Update artist
const updateArtist: RequestHandler = async (req, res) => {
  try {
    const artist = await artistRepository.findOne({ where: { id: req.params.id } });
    if (!artist) {
      res.status(404).json({ message: 'Artist not found' });
      return;
    }
    
    // Handle bookingUserId separately if provided
    const { bookingUserId, ...updateData } = req.body;
    if (bookingUserId !== undefined) {
      artist.bookingUserId = bookingUserId || null;
    }
    
    artistRepository.merge(artist, updateData);
    const result = await artistRepository.save(artist);
    
    // Reload with relations
    const updatedArtist = await artistRepository.findOne({ 
      where: { id: req.params.id },
      relations: ['bookingUser']
    });
    
    res.json(updatedArtist);
  } catch (error) {
    res.status(500).json({ message: 'Error updating artist' });
  }
};

// Delete artist
const deleteArtist: RequestHandler = async (req, res) => {
  try {
    console.log(`🔴 Attempting to delete artist with ID: ${req.params.id}`);
    
    const artist = await artistRepository.findOne({ where: { id: req.params.id } });
    if (!artist) {
      console.log(`❌ Artist not found: ${req.params.id}`);
      res.status(404).json({ message: 'Artist not found' });
      return;
    }

    console.log(`✅ Found artist: ${artist.name}`);

    // Check if artist has any related EventArtist records
    const eventArtistRepository = AppDataSource.getRepository('EventArtist');
    const relatedEventArtists = await eventArtistRepository.find({
      where: { artist: { id: req.params.id } },
      relations: ['event']
    });

    console.log(`🔍 Found ${relatedEventArtists.length} related EventArtist records`);

    if (relatedEventArtists.length > 0) {
      const eventNames = relatedEventArtists.map(ea => ea.event?.title || 'Unknown Event').join(', ');
      const eventIds = relatedEventArtists.map(ea => ea.event?.id).filter(id => id);
      
      console.log(`❌ Cannot delete artist - associated with events: ${eventNames}`);
      
      return res.status(400).json({ 
        message: 'Cannot delete artist. This artist is associated with events and must be removed from all events first.',
        relatedEvents: relatedEventArtists.length,
        eventNames: eventNames,
        eventIds: eventIds,
        details: `Please remove this artist from the following events before deleting: ${eventNames}`
      });
    }

    console.log(`🗑️ No related events found, proceeding with deletion`);
    await artistRepository.remove(artist);
    console.log(`✅ Artist deleted successfully: ${artist.name}`);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting artist:', error);
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message && error.message.includes('foreign key constraint')) {
      console.log(`🔒 Foreign key constraint error detected`);
      return res.status(400).json({ 
        message: 'Cannot delete artist. This artist is associated with events and must be removed from all events first.',
        details: 'Please remove this artist from all events before deleting.'
      });
    }
    
    res.status(500).json({ message: 'Error deleting artist' });
  }
};

// Upload artist image
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

    // Create file path relative to uploads directory
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

// Add embedding to artist
const addEmbedding: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { embedCode } = req.body;

    if (!embedCode) {
      return res.status(400).json({ message: 'Embed code is required' });
    }

    const artist = await artistRepository.findOne({ where: { id } });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Validate and sanitize the embed code
    const validation = validateAndSanitizeEmbedding(embedCode);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Sanitize the embed code
    const sanitizedCode = sanitizeEmbedCode(validation.sanitizedCode!);

    // Create new embedding
    const newEmbedding = createEmbedding(sanitizedCode);
    if (!newEmbedding) {
      return res.status(400).json({ message: 'Failed to create embedding' });
    }

    // Add to artist's embeddings array
    if (!artist.embeddings) {
      artist.embeddings = [];
    }
    artist.embeddings.push(newEmbedding);

    await artistRepository.save(artist);

    res.status(201).json({
      message: 'Embedding added successfully',
      embedding: newEmbedding
    });
  } catch (error) {
    console.error('Error adding embedding:', error);
    res.status(500).json({ message: 'Error adding embedding' });
  }
};

// Update embedding
const updateEmbedding: RequestHandler = async (req, res) => {
  try {
    const { id, embeddingId } = req.params;
    const { embedCode } = req.body;

    if (!embedCode) {
      return res.status(400).json({ message: 'Embed code is required' });
    }

    const artist = await artistRepository.findOne({ where: { id } });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    if (!artist.embeddings) {
      return res.status(404).json({ message: 'No embeddings found' });
    }

    const embeddingIndex = artist.embeddings.findIndex(emb => emb.id === embeddingId);
    if (embeddingIndex === -1) {
      return res.status(404).json({ message: 'Embedding not found' });
    }

    // Validate and sanitize the embed code
    const validation = validateAndSanitizeEmbedding(embedCode);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    // Sanitize the embed code
    const sanitizedCode = sanitizeEmbedCode(validation.sanitizedCode!);

    // Update the embedding
    artist.embeddings[embeddingIndex] = {
      ...artist.embeddings[embeddingIndex],
      embedCode: sanitizedCode,
      platform: validation.platform!,
      title: validation.title,
      description: validation.description,
      thumbnailUrl: validation.thumbnailUrl
    };

    await artistRepository.save(artist);

    res.json({
      message: 'Embedding updated successfully',
      embedding: artist.embeddings[embeddingIndex]
    });
  } catch (error) {
    console.error('Error updating embedding:', error);
    res.status(500).json({ message: 'Error updating embedding' });
  }
};

// Delete embedding
const deleteEmbedding: RequestHandler = async (req, res) => {
  try {
    const { id, embeddingId } = req.params;

    const artist = await artistRepository.findOne({ where: { id } });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    if (!artist.embeddings) {
      return res.status(404).json({ message: 'No embeddings found' });
    }

    const embeddingIndex = artist.embeddings.findIndex(emb => emb.id === embeddingId);
    if (embeddingIndex === -1) {
      return res.status(404).json({ message: 'Embedding not found' });
    }

    // Remove the embedding
    artist.embeddings.splice(embeddingIndex, 1);
    await artistRepository.save(artist);

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