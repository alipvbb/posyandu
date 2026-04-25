import { ApiError } from '../utils/api-error.js';

export const requirePermission = (permissionCode) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthenticated'));
  }

  if (!req.user.permissions.includes(permissionCode)) {
    return next(new ApiError(403, 'Anda tidak memiliki izin untuk aksi ini'));
  }

  return next();
};

