import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { defaultLimiter } from './middleware/rate-limiter.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import coursesRoutes from './modules/courses/courses.routes.js';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import staffRoutes from './modules/staff/staff.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import assignmentsRoutes from './modules/assignments/assignments.routes.js';
import certificatesRoutes from './modules/certificates/certificates.routes.js';
import blogRoutes from './modules/blog/blog.routes.js';
import galleryRoutes from './modules/gallery/gallery.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';

const app = express();

// Security
app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(defaultLimiter);

// Body parsing & cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Docs ────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => { res.json(swaggerSpec); });

// ─── API Routes ──────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/courses', coursesRoutes);
app.use('/enrollments', enrollmentsRoutes);
app.use('/students', studentsRoutes);
app.use('/staff', staffRoutes);
app.use('/payments', paymentsRoutes);
app.use('/assignments', assignmentsRoutes);
app.use('/certificates', certificatesRoutes);
app.use('/blog', blogRoutes);
app.use('/gallery', galleryRoutes);
app.use('/stats', statsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
