import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { GalleryImage } from '../models/GalleryImage';
import { Event } from '../models/Event';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware';
import path from 'path';
import fs from 'fs';
import express from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
const galleryImageRepository = AppDataSource.getRepository(GalleryImage);
const eventRepository = AppDataSource.getRepository(Event);

interface GalleryImageParams {
  id: string;
}

// Helper function to validate eventId
const validateEventId = async (eventId?: string): Promise<boolean> => {
  if (!eventId) return true; // eventId is optional
  
  const event = await eventRepository.findOne({ where: { id: eventId } });
  return !!event;
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new gallery image
 *     tags: [Gallery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: Optional event ID to link the image to an event
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPEG, PNG, WebP, max 5MB)
 *               title:
 *                 type: string
 *                 description: Title for the image
 *               description:
 *                 type: string
 *                 description: Description of the image
 *               category:
 *                 type: string
 *                 enum: [event, venue, artist, other]
 *                 default: other
 *                 description: Category of the image
 *               tags:
 *                 type: string
 *                 description: JSON array of tags
 *               uploadedBy:
 *                 type: string
 *                 description: Name of the person uploading
 *               eventId:
 *                 type: string
 *                 description: Optional event ID to link the image to an event
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 galleryImage:
 *                   type: object
 *                 file:
 *                   type: object
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: Optional event ID to link the image to an event
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
const getAllGalleryImages: RequestHandler = async (_req, res) => {
  try {
    const galleryImages = await galleryImageRepository.find();
    res.json(galleryImages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery images' });
  }
};

// Get gallery image by ID
const getGalleryImageById: RequestHandler = async (req, res) => {
  try {
    const galleryImage = await galleryImageRepository.findOne({
      where: { id: req.params.id }
    });
    if (!galleryImage) {
      res.status(404).json({ message: 'Gallery image not found' });
      return;
    }
    res.json(galleryImage);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery image' });
  }
};

// Create gallery image
const createGalleryImage: RequestHandler = async (req, res) => {
  try {
    const { eventId, ...imageData } = req.body;
    
    // Validate eventId if provided
    if (eventId && !(await validateEventId(eventId))) {
      return res.status(400).json({ message: 'Invalid eventId provided' });
    }
    
    const galleryImage = galleryImageRepository.create({
      ...imageData,
      eventId: eventId || null
    });
    const result = await galleryImageRepository.save(galleryImage);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error creating gallery image' });
  }
};

// Update gallery image
const updateGalleryImage: RequestHandler = async (req, res) => {
  try {
    const { eventId, ...updateData } = req.body;
    
    // Validate eventId if provided
    if (eventId && !(await validateEventId(eventId))) {
      return res.status(400).json({ message: 'Invalid eventId provided' });
    }
    
    const galleryImage = await galleryImageRepository.findOne({
      where: { id: req.params.id }
    });
    if (!galleryImage) {
      res.status(404).json({ message: 'Gallery image not found' });
      return;
    }
    
    galleryImageRepository.merge(galleryImage, {
      ...updateData,
      eventId: eventId !== undefined ? eventId : galleryImage.eventId
    });
    const result = await galleryImageRepository.save(galleryImage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating gallery image' });
  }
};

// Delete gallery image
const deleteGalleryImage: RequestHandler = async (req, res) => {
  try {
    const galleryImage = await galleryImageRepository.findOne({
      where: { id: req.params.id }
    });
    if (!galleryImage) {
      res.status(404).json({ message: 'Gallery image not found' });
      return;
    }
    await galleryImageRepository.remove(galleryImage);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting gallery image' });
  }
};

// Upload gallery image file
const uploadGalleryImage: RequestHandler = async (req, res) => {
  try {
    console.log('Starting file upload process...');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(`File received: ${req.file.originalname} (${req.file.size} bytes)`);

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
    const title = req.body.title || req.file.originalname;
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
    
    // Parse tags safely
    let tags: string[] = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
        if (!Array.isArray(tags)) {
          tags = [];
        }
        // Sanitize tags
        tags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).slice(0, 10); // Limit to 10 tags
      } catch (e) {
        console.warn('Failed to parse tags, using empty array');
        tags = [];
      }
    }

    // Validate eventId if provided
    const eventId = req.body.eventId;
    if (eventId && !(await validateEventId(eventId))) {
      return res.status(400).json({ message: 'Invalid eventId provided' });
    }
    
    console.log(`Creating gallery image record with title: "${title}", description: "${description}", category: ${category}, tags: ${tags.length}`);
    
    // Create gallery image record
    const galleryImage = galleryImageRepository.create({
      filename: req.file.filename,
      url: filePath,
      caption: description,
      category: category,
      tags: tags,
      photographer: req.body.uploadedBy || 'Admin',
      isPublished: true,
      orderIndex: 0,
      eventId: eventId || null
    });

    const result = await galleryImageRepository.save(galleryImage);
    
    console.log(`Gallery image uploaded successfully: ${req.file.filename} by ${req.body.uploadedBy || 'Admin'}`);
    
    res.status(201).json({
      message: 'File uploaded successfully',
      galleryImage: result,
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
          console.log(`Cleaned up uploaded file after database error: ${req.file.filename}`);
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
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 50, // More lenient in development (200 vs 50 in production)
  message: 'Too many upload requests from this IP, please try again after 15 minutes',
  skip: (req: express.Request, res: express.Response) => {
    if (isDevelopment) {
      const ip = req.ip || req.socket.remoteAddress || '';
      // Skip for localhost in development
      if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
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

/* 
Request URL
https://l8events.dk/api/gallery/upload
Request Method
POST
Status Code
404 Not Found
Remote Address
91.210.57.215:443
Referrer Policy
no-referrer-when-downgrade
 */
export default router; 