import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default to info level, configurable via .env
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [] // Remove the default Console transport here
});

// For development, use a colored console output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      logFormat
    ),
  }));
} else {
  // Add a non-colored console transport for production
  logger.add(new winston.transports.Console());
}

export default logger;