import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import morgan from 'morgan';
import { APP_SHORT_NAME } from './config/app-meta.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(',').map((item) => item.trim()),
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: `API ${APP_SHORT_NAME} running` });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: `API ${APP_SHORT_NAME} running` });
});

app.use('/api', apiRouter);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(currentDir, '../../frontend/dist');

if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
