import cookieParser from 'cookie-parser';
import compression from 'compression';
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
app.use(
  compression({
    threshold: 1024,
  }),
);
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
const frontendAssetsPath = path.resolve(frontendDistPath, 'assets');

if (existsSync(frontendDistPath)) {
  if (existsSync(frontendAssetsPath)) {
    app.use(
      '/assets',
      express.static(frontendAssetsPath, {
        maxAge: '365d',
        immutable: true,
      }),
    );
  }

  app.use(
    express.static(frontendDistPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );

  app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
