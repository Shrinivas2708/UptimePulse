import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';
import { IMonitor } from '../models/Monitor';
import Monitor from '../models/Monitor';
import StatusPage from '../models/StatusPage';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  // Explicitly cast req.user to the type set by authMiddleware
  const userPayload = req.user as { userId: string };

  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { userId } = userPayload;

  try {
    logger.info(`Fetching user profile for user ID: ${userId}`);
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      logger.warn(`User profile not found for user ID: ${userId}`);
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    logger.error(`Failed to get user profile for user ID ${userId}:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  // Explicitly cast req.user to the type set by authMiddleware
  const userPayload = req.user as { userId: string };

  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { userId } = userPayload;

  try {
    const { name, password, preferences } = req.body;
    logger.info(`Updating user profile for user ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User profile not found for user ID: ${userId}`);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 12);
    }
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();
    logger.info(`Successfully updated user profile for user ID: ${userId}`);
    res.json({ message: 'User profile updated successfully' });
  } catch (err: any) {
    logger.error(`Failed to update user profile for user ID ${userId}:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};