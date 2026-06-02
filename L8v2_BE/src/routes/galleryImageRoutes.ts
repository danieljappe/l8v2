import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware';
import { GalleryImageService } from '../services/GalleryImageService';
import path from 'path';
import fs from 'fs';
import express from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
const galleryImageService = new GalleryImageService();

/**
 * @swagger
 * tags:
 *   - name: Gallery
 *     description: Gallery image management
 * /api/gallery:
 *   get:
 *     summary: Retrieve a list of gallery images
 *     tags: [Gallery]
 *     responses:
 *       200:
 *         description: A list of gallery images
 *   post:
 *     summary: Create a new gallery image
 *     tags: [Gallery]
 *     responses:
 *       201:
 *         description: Gallery image created
 *       500:
 *         description: Error creating gallery image
 *
 * /api/gallery/upload:
 *   post:
 *     summary: Upload a new gallery image file
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Bad request (invalid file, missing fields, etc.)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /api/gallery/{id}:
 *   get:
 *     summary: Get a gallery image by ID
 *     tags: [Gallery]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gallery image found
 *       404:
 *         description: Gallery image not found
 *   put:
 *     summary: Update a gallery image by ID
 *     tags: [Gallery]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gallery image updated
 *       404:
 *         description: Gallery image not found
 *   delete:
 *     summary: Delete a gallery image by ID
 *     tags: [Gallery]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Gallery image deleted
 *       404:
 *         description: Gallery image not found
 */

// Get all gallery images
// Optional query params:
//   ?eventId=<uuid>   — only images for that event, ordered by createdAt ASC,
//                       uses IDX_gallery_image_eventId_createdAt
//   ?limit=N          — max rows returned (intended for use with eventId)
const getAllGalleryImages: RequestHandler = async (req, res) => {
  try {
    const { eventId, limit } = req.query;
    const take = limit ? parseInt(limit as string, 10) : undefined;
    const eventFilter = typeof eventId === 'string' ? eventId : undefined;
    const images = await galleryImageService.getAllImages(eventFilter, take);
    res.json(images);
  } catch {
    res.status(500).json({ message: 'Error fetching gallery images' });
  }
};

// Get gallery image by ID
const getGalleryImageById: RequestHandler = async (req, res) => {
  try {
    const galleryImage = await galleryImageService.getImageById(req.params.id);
    if (!galleryImage) {
      res.status(404).json({ message: 'Gallery image not found' });
      return;
    }
    res.json(galleryImage);
  } catch {
    res.status(500).json({ message: 'Error fetching gallery image' });
  }
};

// Create gallery image
const createGalleryImage: RequestHandler = async (req, res) => {
  try {
    const { eventId, ...imageData } = req.body;
    const result = await galleryImageService.createImage(eventId, imageData);
    if (result.status === 'invalid_event') {
      res.status(400).json({ message: 'Invalid eventId provided' });
      return;
    }
    res.status(201).json(result.image);
  } catch {
    res.status(500).json({ message: 'Error creating gallery image' });
  }
};

// Update gallery image
const updateGalleryImage: RequestHandler = async (req, res) => {
  try {
    const { eventId, ...updateData } = req.body;
    const result = await galleryImageService.updateImage(req.params.id, eventId, updateData);
    if (result.status === 'invalid_event') {
      res.status(400).json({ message: 'Invalid eventId provided' });
      return;
    }
    if (result.status === 'not_found') {
      res.status(404).json({ message: 'Gallery image not found' });
      return;
    }
    res.json(result.image);
  } catch {
    res.status(500).json({ message: 'Error updating gallery image' });
  }
};

// Delete gallery image
const deleteGalleryImage: RequestHandler = async (req, res) => {
  try {
    const deleted = await galleryImageService.deleteImage(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Gallery image not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting gallery image' });
  }
};

// Upload gallery image file (file handling stays here; DB write goes via service)
const uploadGalleryImage: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Additional file size check
    if (req.file.size > 15 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds 15MB limit' });
    }

    // Validate file type by checking mimetype
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' });
    }

    // Make title/description optional - use filename as fallback
    const description = req.body.description || req.file.originalname;

    // Validate category
    const allowedCategories = ['event', 'venue', 'artist', 'other'];
    const category = req.body.category || 'other';
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category. Allowed values: event, venue, artist, other' });
    }

    // Validate filename for security
    if (!req.file.filename || req.file.filename.includes('..') || req.file.filename.includes('/')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    // Create file path relative to uploads directory
    const filePath = `/uploads/gallery/${req.file.filename}`;

    const eventId = req.body.eventId;
    const result = await galleryImageService.createImage(eventId, {
      filename: req.file.filename,
      url: filePath,
      caption: description,
      category: category,
      photographer: req.body.uploadedBy || 'Admin',
      isPublished: true,
    });

    if (result.status === 'invalid_event') {
      return res.status(400).json({ message: 'Invalid eventId provided' });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      galleryImage: result.image,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: filePath
      }
    });
  } catch (error) {
    console.error('Upload error:', error);

    // If database save failed, try to clean up the uploaded file
    if (req.file) {
      try {
        const filePath = path.join(__dirname, '../../uploads/gallery', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({ message: 'Error uploading file' });
  }
};

// Rate limiting middleware for uploads
// More lenient in development, stricter in production
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
// IPv4-mapped loopback address produced by Node's net stack on dual-stack sockets.
const LOCALHOST_V4_MAPPED = '::ffff:127.0.0.1';
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 50, // More lenient in development (200 vs 50 in production)
  message: 'Too many upload requests from this IP, please try again after 15 minutes',
  skip: (req: express.Request, _res: express.Response) => {
    if (isDevelopment) {
      const ip = req.ip || req.socket.remoteAddress || '';
      // Skip for localhost in development
      if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === LOCALHOST_V4_MAPPED || ip === 'localhost') {
        return true;
      }
    }
    return false;
  },
});

router.get('/', getAllGalleryImages);
router.get('/:id', getGalleryImageById);
router.post('/', authenticateJWT, createGalleryImage);
router.post('/upload', authenticateJWT, uploadLimiter, uploadSingle, handleUploadError, uploadGalleryImage);
router.put('/:id', authenticateJWT, updateGalleryImage);
router.delete('/:id', authenticateJWT, deleteGalleryImage);

export default router;
