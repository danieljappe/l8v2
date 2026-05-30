import { Router, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../middleware/authMiddleware';
import { UserService } from '../services/UserService';

const router = Router();
const userService = new UserService();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: User created
 *       500:
 *         description: Error creating user
 *
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
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
 *         description: User updated
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 */

// Get all users
const getAllUsers: RequestHandler = async (_req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get user by ID
const getUserById: RequestHandler = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Create user
const createUser: RequestHandler = async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Update user
const updateUser: RequestHandler = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    if (!result) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete user
const deleteUser: RequestHandler = async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// User login (token valid 24h; JWT signing is an HTTP concern, kept here)
const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.validateUser(email, password);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch {
    res.status(500).json({ message: 'Error during login' });
  }
};

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', authenticateJWT, createUser);
router.put('/:id', authenticateJWT, updateUser);
router.delete('/:id', authenticateJWT, deleteUser);
router.post('/login', loginUser);

export default router;
