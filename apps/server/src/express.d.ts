// This file is for extending existing types from libraries
import { Request } from "express";

// We are extending the global Express namespace
declare global {
  namespace Express {
    // This adds the 'user' property to the Request interface
    interface Request {
      user?: { // Make it optional as it only exists after authMiddleware
        userId: string;
      };
    }
  }
}
