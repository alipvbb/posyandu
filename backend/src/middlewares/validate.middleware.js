import { z } from 'zod';
import { ApiError } from '../utils/api-error.js';

export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    req.validated = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ApiError(422, 'Validasi gagal', error.flatten()));
      return;
    }

    next(error);
  }
};

