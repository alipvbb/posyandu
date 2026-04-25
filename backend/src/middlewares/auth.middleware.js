import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';

const withKaderCheckupUpdatePermission = (roles, permissions) => {
  const nextPermissions = [...permissions];
  const isKader = roles.some((role) => role.code === 'kader-posyandu');
  if (isKader && !nextPermissions.includes('checkups.update')) {
    nextPermissions.push('checkups.update');
  }
  return nextPermissions;
};

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
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'User tidak aktif atau tidak ditemukan');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map((item) => item.role),
      permissions: withKaderCheckupUpdatePermission(
        user.roles.map((item) => item.role),
        [...new Set(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)))],
      ),
    };

    next();
  } catch (error) {
    next(error);
  }
};
