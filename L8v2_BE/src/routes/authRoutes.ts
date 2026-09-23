import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { loginLimiter } from '../middleware/rateLimiters';
import { JWT_SECRET } from '../config/env';

const router = Router();
const userService = new UserService();

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await userService.validateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // 1d matches POST /api/users/login so session length is a single number.
    const token = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
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
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
