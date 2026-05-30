import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateJWT } from '../middleware/authMiddleware';
import { ContactMessageService } from '../services/ContactMessageService';

const router = Router();
const contactMessageService = new ContactMessageService();

// Stricter rate limiting specifically for contact form submissions
// Limits: 3 submissions per 15 minutes per IP (much stricter than general rate limit)
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10 : 3, // 10 in dev, 3 in production per 15 minutes
  message: {
    error: 'Too many contact form submissions. Please wait 15 minutes before submitting again.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Always skip in test environment (avoids in-memory store accumulation across test cases)
    if (process.env.NODE_ENV === 'test') return true;
    // Skip for localhost in development
    if (isDevelopment) {
      const ip = req.ip || req.socket.remoteAddress || '';
      if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
        return true;
      }
    }
    return false;
  },
  handler: (req, res) => {
    console.log(`🚫 Contact form rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many contact form submissions. Please wait 15 minutes before submitting again.',
      retryAfter: 15
    });
  }
});

/**
 * @swagger
 * tags:
 *   - name: Contact
 *     description: Contact message management
 * /api/contact:
 *   get:
 *     summary: Retrieve a list of contact messages
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: A list of contact messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Contact message created
 *       500:
 *         description: Error creating contact message
 *
 * /api/contact/{id}:
 *   get:
 *     summary: Get a contact message by ID
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact message found
 *       404:
 *         description: Contact message not found
 *   put:
 *     summary: Update a contact message by ID
 *     tags: [Contact]
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
 *         description: Contact message updated
 *       404:
 *         description: Contact message not found
 *   delete:
 *     summary: Delete a contact message by ID
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Contact message deleted
 *       404:
 *         description: Contact message not found
 */

// Get all contact messages
const getAllContactMessages: RequestHandler = async (_req, res) => {
  try {
    const contactMessages = await contactMessageService.findAllMessages();
    res.json(contactMessages);
  } catch {
    res.status(500).json({ message: 'Error fetching contact messages' });
  }
};

// Get contact message by ID
const getContactMessageById: RequestHandler = async (req, res) => {
  try {
    const contactMessage = await contactMessageService.findMessageById(req.params.id);
    if (!contactMessage) {
      res.status(404).json({ message: 'Contact message not found' });
      return;
    }
    res.json(contactMessage);
  } catch {
    res.status(500).json({ message: 'Error fetching contact message' });
  }
};

// Create contact message (public, validated + throttled in the service)
const createContactMessage: RequestHandler = async (req, res) => {
  try {
    const result = await contactMessageService.createContactMessage(req.body);

    if (result.status === 'invalid') {
      return res.status(400).json({ message: result.message });
    }
    if (result.status === 'duplicate') {
      return res.status(429).json({
        message: 'Duplicate message detected. Please wait before submitting the same message again.'
      });
    }
    if (result.status === 'throttled') {
      return res.status(429).json({
        message: 'Too many messages from this email address. Please wait before submitting again.'
      });
    }

    res.status(201).json(result.contactMessage);
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({
      message: 'Error creating contact message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update contact message
const updateContactMessage: RequestHandler = async (req, res) => {
  try {
    const result = await contactMessageService.updateMessage(req.params.id, req.body);
    if (!result) {
      res.status(404).json({ message: 'Contact message not found' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Error updating contact message' });
  }
};

// Delete contact message
const deleteContactMessage: RequestHandler = async (req, res) => {
  try {
    const deleted = await contactMessageService.deleteMessage(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Contact message not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting contact message' });
  }
};

router.get('/', authenticateJWT, getAllContactMessages);
router.get('/:id', authenticateJWT, getContactMessageById);
router.post('/', contactFormLimiter, createContactMessage);
router.put('/:id', authenticateJWT, updateContactMessage);
router.delete('/:id', authenticateJWT, deleteContactMessage);

export default router;
