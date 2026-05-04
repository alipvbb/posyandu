import { ApiError } from '../utils/api-error.js';

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, 'Endpoint tidak ditemukan'));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error?.message || 'Terjadi kesalahan pada server';

  if (statusCode >= 500) {
    console.error(error);
  } else {
    // Hindari log stack trace berulang untuk error validasi/auth yang memang expected.
    console.warn(`[HTTP ${statusCode}] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
  });
};
