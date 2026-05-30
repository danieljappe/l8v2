import { Router, Response, RequestHandler } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';
import jwt from 'jsonwebtoken';
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
 *
 * /api/users/login:
 *   post:
 *     summary: Login and get a JWT
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
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
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await userService.createUser({ firstName, lastName, email, password });
    if (result.status === 'duplicate') {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    res.status(201).json(result.user);
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

// Login user (token valid 1d; JWT signing is an HTTP concern, kept here)
const loginUser: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await userService.validateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ message: 'Error logging in' });
  }
};

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', authenticateJWT, createUser);
router.put('/:id', authenticateJWT, updateUser);
router.delete('/:id', authenticateJWT, deleteUser);
router.post('/login', loginUser);
router.put('/:id/password', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;

  if (!req.user || req.user.id !== userId) {
    return res.status(403).json({ message: 'Not authorized to change this password' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  try {
    const result = await userService.changePassword(userId, currentPassword, newPassword);
    if (result.status === 'not_found') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (result.status === 'wrong_password') {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    return res.status(500).json({ message: 'Error updating password' });
  }
});

export default router;
