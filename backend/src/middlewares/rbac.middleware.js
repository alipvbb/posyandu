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

export const requireAnyPermission = (...permissionCodes) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthenticated'));
  }

  const hasAccess = permissionCodes.some((permissionCode) => req.user.permissions.includes(permissionCode));
  if (!hasAccess) {
    return next(new ApiError(403, 'Anda tidak memiliki izin untuk aksi ini'));
  }

  return next();
};
