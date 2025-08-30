import { Request, Response, NextFunction } from 'express';
import logger from './logger';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

export default errorHandler;