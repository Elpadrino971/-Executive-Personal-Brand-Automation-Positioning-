import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './config/logger';
import { connectRedis } from './config/redis';
import { pool } from './config/database';
import { ContentScheduler } from './services/queue/ContentScheduler';
import { initializeSentry } from './config/sentry';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();
initializeSentry();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(
  rateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  })
);

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    // Test database connection
    const dbClient = await pool.connect();
    logger.info('Database connected');
    dbClient.release();

    // Connect to Redis
    await connectRedis();

    // Initialize scheduler
    await ContentScheduler.initialize();

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const start = async () => {
  await initializeServices();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Only start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
