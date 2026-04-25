import { ApiError } from '../utils/api-error.js';

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, 'Endpoint tidak ditemukan'));
};

export const errorHandler = (error, _req, res, _next) => {
  console.error(error);
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Terjadi kesalahan pada server',
    details: error.details || null,
  });
};

