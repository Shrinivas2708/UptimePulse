import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { getUserProfile, updateUserProfile } from '../controllers/userController';
import authMiddleware from '../utils/authMiddleware';
import passport from 'passport';
import jwt from "jsonwebtoken";
// Import the IUser type from your models
import { IUser } from '../models/User';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' , session: false}),
  (req, res) => {
    // Add a check to ensure req.user exists
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }
    // Cast req.user to your IUser type to access its properties safely
    const user = req.user as unknown as IUser;

    // On successful authentication, generate a JWT using the correct property (_id)
    // The JWT payload should match what your authMiddleware expects (userId)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Redirect with the token
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
  }
);

// User Profile Routes
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

export default router;