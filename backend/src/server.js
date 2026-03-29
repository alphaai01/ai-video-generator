/**
 * Express Server Configuration
 * Main application entry point with middleware setup and routes
 */

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import routes
import videoRoutes from './routes/video.js';
import speechRoutes from './routes/speech.js';

// Import middleware
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler.js';

// Initialize environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Middleware Setup
 */

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging with Morgan
const morganFormat = NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  skip: (req, res) => {
    // Skip health check endpoints
    return req.path === '/health';
  },
}));

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

/**
 * API Status Endpoint
 */
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      video: '/api/video',
      speech: '/api/speech',
    },
  });
});

/**
 * Routes Registration
 */
app.use('/api/video', videoRoutes);
app.use('/api/speech', speechRoutes);

/**
 * Request Validation Middleware
 * Provides basic request validation for content-type
 */
app.use((req, res, next) => {
  if (
    ['POST', 'PUT', 'PATCH'].includes(req.method) &&
    req.is('application/json') === false &&
    req.is('multipart/form-data') === false &&
    Object.keys(req.body).length > 0
  ) {
    // Only warn if there's actually a body
    console.warn(
      `[Server] Request ${req.method} ${req.path} may have wrong content-type`
    );
  }
  next();
});

/**
 * Serve Next.js Frontend in Production
 * In production, the backend serves the built Next.js static export
 */
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/.next/standalone');
  const staticPath = path.join(__dirname, '../../frontend/.next/static');
  const publicPath = path.join(__dirname, '../../frontend/public');

  // Serve Next.js static assets
  app.use('/_next/static', express.static(staticPath, { maxAge: '1y', immutable: true }));
  app.use(express.static(publicPath, { maxAge: '1d' }));

  // For all non-API routes, proxy to the Next.js standalone server
  // or serve the static export
  const nextStaticExport = path.join(__dirname, '../../frontend/out');
  if (fs.existsSync(nextStaticExport)) {
    app.use(express.static(nextStaticExport));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(nextStaticExport, 'index.html'));
      }
    });
  }

  console.log('[Server] Serving frontend static files in production mode');
}

/**
 * 404 Handler (must be before error handler)
 */
app.use(notFoundHandler);

/**
 * Global Error Handler (must be last)
 */
app.use(errorHandler);

/**
 * Unhandled Promise Rejection Handler
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Graceful Shutdown Handler
 */
const gracefulShutdown = (signal) => {
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   AI Video Generator - Backend Service                    ║
╠════════════════════════════════════════════════════════════╣
║  Status:        Running                                    ║
║  Port:          ${PORT.toString().padEnd(46)}║
║  Environment:   ${NODE_ENV.padEnd(44)}║
║  Node Version:  ${process.version.padEnd(43)}║
╠════════════════════════════════════════════════════════════╣
║  Available Endpoints:                                      ║
║  • POST   /api/video/generate-text                         ║
║  • POST   /api/video/generate-image                        ║
║  • GET    /api/video/status/:jobId                         ║
║  • GET    /api/video/download/:jobId                       ║
║  • GET    /api/video/list                                  ║
║  • POST   /api/video/validate-prompt                       ║
║  • POST   /api/speech/to-text                              ║
║  • POST   /api/speech/to-audio                             ║
║  • GET    /api/speech/available-voices                     ║
║  • POST   /api/speech/validate-text                        ║
║  • POST   /api/speech/validate-voice                       ║
║  • GET    /api/speech/health                               ║
║  • GET    /health                                          ║
║  • GET    /api/status                                      ║
╠════════════════════════════════════════════════════════════╣
║  Swagger/Docs: Not yet implemented                         ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Store server instance for graceful shutdown
export default app;
