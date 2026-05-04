import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { extractCustomPermissionCodes, resolveEffectiveUserPermissions } from '../utils/user-permissions.js';

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      throw new ApiError(401, 'Token tidak ditemukan');
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        village: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'User tidak aktif atau tidak ditemukan');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      villageId: user.villageId || null,
      village: user.village
        ? {
            id: user.village.id,
            name: user.village.name,
            code: user.village.code,
          }
        : null,
      roles: user.roles.map((item) => item.role),
      useCustomPermissions: Boolean(user.useCustomPermissions),
      customPermissionCodes: extractCustomPermissionCodes(user),
      permissions: resolveEffectiveUserPermissions(user),
    };

    next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Sesi login berakhir. Silakan login ulang.'));
    }

    if (error?.name === 'JsonWebTokenError' || error?.name === 'NotBeforeError') {
      return next(new ApiError(401, 'Token tidak valid'));
    }

    next(error);
  }
};
