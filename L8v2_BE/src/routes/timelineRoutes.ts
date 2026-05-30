import { Router, RequestHandler } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { TimelineService } from '../services/TimelineService';

const router = Router();
const timelineService = new TimelineService();

// GET /api/timeline/:eventId
const getTimeline: RequestHandler = async (req, res) => {
  try {
    const rows = await timelineService.getTimeline(req.params.eventId);
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Error fetching timeline' });
  }
};

// POST /api/timeline/:eventId
const addItem: RequestHandler = async (req, res) => {
  try {
    const result = await timelineService.addItem(req.params.eventId, req.body);
    if (result.status === 'invalid') {
      return res.status(400).json({ message: result.message });
    }
    res.status(201).json(result.item);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error adding timeline item', error: msg });
  }
};

// PUT /api/timeline/:eventId/reorder
const reorderItems: RequestHandler = async (req, res) => {
  try {
    const { items } = req.body as { items: { id: string; position: number }[] };
    const result = await timelineService.reorderItems(req.params.eventId, items);
    if (result.status === 'invalid') {
      return res.status(400).json({ message: result.message });
    }
    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: 'Error reordering timeline', error: msg });
  }
};

// PATCH /api/timeline/:eventId/items/:itemId
const updateItem: RequestHandler = async (req, res) => {
  try {
    const { eventId, itemId } = req.params;
    const result = await timelineService.updateItem(eventId, itemId, req.body);
    if (result.status === 'not_found') {
      return res.status(404).json({ message: 'Timeline item not found' });
    }
    res.json(result.item);
  } catch {
    res.status(500).json({ message: 'Error updating timeline item' });
  }
};

// DELETE /api/timeline/:eventId/items/:itemId
const deleteItem: RequestHandler = async (req, res) => {
  try {
    const { eventId, itemId } = req.params;
    const result = await timelineService.deleteItem(eventId, itemId);
    if (result.status === 'not_found') {
      return res.status(404).json({ message: 'Timeline item not found' });
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting timeline item' });
  }
};

router.get('/:eventId', getTimeline);
router.post('/:eventId', authenticateJWT, addItem);
router.put('/:eventId/reorder', authenticateJWT, reorderItems);
router.patch('/:eventId/items/:itemId', authenticateJWT, updateItem);
router.delete('/:eventId/items/:itemId', authenticateJWT, deleteItem);

export default router;
