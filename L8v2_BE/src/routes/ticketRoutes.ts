import { Router, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Ticket } from '../models/Ticket';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const ticketRepository = AppDataSource.getRepository(Ticket);

interface TicketParams {
  id: string;
}

/**
 * @swagger
 * tags:
 *   - name: Tickets
 *     description: Ticket management
 * /api/tickets:
 *   get:
 *     summary: Retrieve a list of tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: A list of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Ticket created
 *       500:
 *         description: Error creating ticket
 *
 * /api/tickets/{id}:
 *   get:
 *     summary: Get a ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket found
 *       404:
 *         description: Ticket not found
 *   put:
 *     summary: Update a ticket by ID
 *     tags: [Tickets]
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
 *         description: Ticket updated
 *       404:
 *         description: Ticket not found
 *   delete:
 *     summary: Delete a ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Ticket deleted
 *       404:
 *         description: Ticket not found
 */

// Get all tickets
const getAllTickets: RequestHandler = async (_req, res) => {
  try {
    const tickets = await ticketRepository.find({
      relations: ['event', 'user']
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};

// Get ticket by ID
const getTicketById: RequestHandler = async (req, res) => {
  try {
    const ticket = await ticketRepository.findOne({
      where: { id: req.params.id },
      relations: ['event', 'user']
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket' });
  }
};

// Create ticket
const createTicket: RequestHandler = async (req, res) => {
  try {
    const ticket = ticketRepository.create(req.body);
    const result = await ticketRepository.save(ticket);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error creating ticket' });
  }
};

// Update ticket
const updateTicket: RequestHandler = async (req, res) => {
  try {
    const ticket = await ticketRepository.findOne({
      where: { id: req.params.id },
      relations: ['event', 'user']
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    ticketRepository.merge(ticket, req.body);
    const result = await ticketRepository.save(ticket);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating ticket' });
  }
};

// Delete ticket
const deleteTicket: RequestHandler = async (req, res) => {
  try {
    const ticket = await ticketRepository.findOne({
      where: { id: req.params.id },
      relations: ['event', 'user']
    });
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    await ticketRepository.remove(ticket);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ticket' });
  }
};

router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.post('/', authenticateJWT, createTicket);
router.put('/:id', authenticateJWT, updateTicket);
router.delete('/:id', authenticateJWT, deleteTicket);

export default router; 