import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, '../..');

// Prioritaskan env file di folder backend saat dijalankan dari root monorepo.
dotenv.config({ path: path.join(backendRoot, '.env') });
// Tetap dukung default dotenv lookup untuk kompatibilitas hosting.
dotenv.config();

const buildDatabaseUrlFromParts = () => {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;

  if (!host || !user || !name) {
    return undefined;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password || '');

  return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}`;
};

const resolvedDatabaseUrl = process.env.DATABASE_URL || buildDatabaseUrlFromParts();
if (resolvedDatabaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!resolvedDatabaseUrl) {
  throw new Error(
    'Missing database config: set DATABASE_URL atau kombinasi DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME',
  );
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: resolvedDatabaseUrl,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  appPublicBaseUrl: process.env.APP_PUBLIC_BASE_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
