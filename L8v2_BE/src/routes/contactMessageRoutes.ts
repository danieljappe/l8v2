import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ContactMessage } from '../models/ContactMessage';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const contactMessageRepository = AppDataSource.getRepository(ContactMessage);

// Stricter rate limiting specifically for contact form submissions
// Limits: 3 submissions per 15 minutes per IP (much stricter than general rate limit)
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
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
    const contactMessages = await contactMessageRepository.find();
    res.json(contactMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact messages' });
  }
};

// Get contact message by ID
const getContactMessageById: RequestHandler = async (req, res) => {
  try {
    const contactMessage = await contactMessageRepository.findOne({
      where: { id: req.params.id }
    });
    if (!contactMessage) {
      res.status(404).json({ message: 'Contact message not found' });
      return;
    }
    res.json(contactMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact message' });
  }
};

// Create contact message
const createContactMessage: RequestHandler = async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Name, email, and message are required fields' 
      });
    }

    // Trim and validate input lengths
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();
    const trimmedSubject = subject?.trim() || null;

    // Length validation to prevent abuse
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ 
        message: 'Name must be between 2 and 100 characters' 
      });
    }

    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      return res.status(400).json({ 
        message: 'Message must be between 10 and 5000 characters' 
      });
    }

    if (trimmedSubject && trimmedSubject.length > 200) {
      return res.status(400).json({ 
        message: 'Subject must be less than 200 characters' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Check for duplicate submissions (same email + same message) within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const duplicateCheck = await contactMessageRepository.findOne({
      where: {
        email: trimmedEmail,
        message: trimmedMessage,
        createdAt: MoreThanOrEqual(oneHourAgo)
      }
    });

    if (duplicateCheck) {
      return res.status(429).json({ 
        message: 'Duplicate message detected. Please wait before submitting the same message again.' 
      });
    }

    // Check for too many messages from same email in last hour (max 5)
    const recentMessagesCount = await contactMessageRepository.count({
      where: {
        email: trimmedEmail,
        createdAt: MoreThanOrEqual(oneHourAgo)
      }
    });

    if (recentMessagesCount >= 5) {
      return res.status(429).json({ 
        message: 'Too many messages from this email address. Please wait before submitting again.' 
      });
    }

    // Basic spam detection - check for common spam patterns
    const spamPatterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/i, // URL shorteners
      /(?:buy|cheap|discount|offer|deal|sale).*(?:now|today|limited)/i, // Common spam keywords
      /(?:click here|visit now|act now|order now)/i,
      /(?:free money|make money|earn money|get rich)/i,
    ];

    const messageLower = trimmedMessage.toLowerCase();
    const subjectLower = trimmedSubject?.toLowerCase() || '';
    const combinedText = `${subjectLower} ${messageLower}`;

    for (const pattern of spamPatterns) {
      if (pattern.test(combinedText)) {
        console.log(`⚠️ Potential spam detected from ${trimmedEmail}: ${pattern}`);
        // Log but don't block - let admin review
        // You can uncomment the return below to block automatically
        // return res.status(400).json({ message: 'Message contains suspicious content' });
      }
    }

    const contactMessage = contactMessageRepository.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      subject: trimmedSubject,
    });
    
    const result = await contactMessageRepository.save(contactMessage);
    res.status(201).json(result);
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
    const contactMessage = await contactMessageRepository.findOne({
      where: { id: req.params.id }
    });
    if (!contactMessage) {
      res.status(404).json({ message: 'Contact message not found' });
      return;
    }
    contactMessageRepository.merge(contactMessage, req.body);
    const result = await contactMessageRepository.save(contactMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating contact message' });
  }
};

// Delete contact message
const deleteContactMessage: RequestHandler = async (req, res) => {
  try {
    const contactMessage = await contactMessageRepository.findOne({
      where: { id: req.params.id }
    });
    if (!contactMessage) {
      res.status(404).json({ message: 'Contact message not found' });
      return;
    }
    await contactMessageRepository.remove(contactMessage);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact message' });
  }
};

router.get('/', authenticateJWT, getAllContactMessages);
router.get('/:id', authenticateJWT, getContactMessageById);
router.post('/', contactFormLimiter, createContactMessage); // Public endpoint with rate limiting
router.put('/:id', authenticateJWT, updateContactMessage);
router.delete('/:id', authenticateJWT, deleteContactMessage);

export default router; 