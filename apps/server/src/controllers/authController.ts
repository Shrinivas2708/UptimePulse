import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../utils/logger';
import Integration from '../models/Integration';

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const register = async (req: RegisterRequest, res: Response): Promise<void> => {
  try {
    const { email, password ,name} = req.body;
    logger.info(`Attempting to register new user: ${email} with name ${name}`);
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, passwordHash: hashedPassword , name});
    await user.save();
    logger.info(`Successfully registered user: ${email}`);
    const defaultEmailIntegration = new Integration({
      userId: user._id,
      type: 'email',
      name: 'Primary Email', // Use a distinct name
      details: {
        email: user.email,
      },
    });
    await defaultEmailIntegration.save();
    logger.info(`Created default email integration for user: ${email}`);
    res.status(201).json({ message: 'User registered' });
  } catch (err: any) {
    logger.error(`Registration failed for email ${req.body.email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: LoginRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    logger.info(`Attempting to log in user: ${email}`);
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      logger.info(`Login failed for email ${email}: Invalid credentials`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    logger.info(`Successfully logged in user: ${email}`);
    res.json({ token });
  } catch (err: any) {
    logger.error(`Login failed for email ${req.body.email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};