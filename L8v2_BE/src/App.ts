import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import { AppDataSource } from './config/database';
import userRoutes from './routes/userRoutes';
import artistRoutes from './routes/artistRoutes';
import eventRoutes from './routes/eventRoutes';
import venueRoutes from './routes/venueRoutes';
import eventArtistRoutes from './routes/eventArtistRoutes';
import ticketRoutes from './routes/ticketRoutes';
import galleryImageRoutes from './routes/galleryImageRoutes';
import contactMessageRoutes from './routes/contactMessageRoutes';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import path from 'path';

dotenv.config();

export function createApp(): Express {
  const app: Express = express();

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Middleware
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://l8events.dk',
      'https://www.l8events.dk'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  }));
  app.use(helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "*"], // Allow images from anywhere
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded images statically
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Request logging middleware
  app.use(requestLogger);

  // Rate limiting configuration
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  const rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : parseInt(process.env.RATE_LIMIT_MAX || '500'),
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: express.Request, _res: express.Response) => {
      if (isDevelopment) {
        const ip = req.ip || req.socket.remoteAddress || '';
        if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
          return true;
        }
      }
      return false;
    },
    handler: (req: express.Request, res: express.Response) => {
      console.log(`🚫 Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60 / 60)
      });
    }
  };

  const limiter = rateLimit(rateLimitConfig);
  app.use(limiter);

  if (isDevelopment) {
    console.log(`🚀 Rate limiting enabled in development mode (${rateLimitConfig.max} requests per 15 min, localhost bypassed)`);
  } else {
    console.log(`🛡️ Rate limiting enabled in ${process.env.NODE_ENV} mode (${rateLimitConfig.max} requests per 15 min)`);
  }

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/artists', artistRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/venues', venueRoutes);
  app.use('/api/event-artists', eventArtistRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/gallery', galleryImageRoutes);
  app.use('/api/contact', contactMessageRoutes);
  app.use('/api/auth', authRoutes);

  // Swagger setup
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'L8v2 API',
        version: '1.0.0',
        description: 'API documentation for L8v2 backend',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.ts'],
  };
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Database connection and server start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
