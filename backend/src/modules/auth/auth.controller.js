import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';

const withKaderCheckupUpdatePermission = (roles, permissions) => {
  const nextPermissions = [...permissions];
  const isKader = roles.some((item) => item.role.code === 'kader-posyandu');
  if (isKader && !nextPermissions.includes('checkups.update')) {
    nextPermissions.push('checkups.update');
  }
  return nextPermissions;
};

const getUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status,
  roles: user.roles.map((item) => ({
    id: item.role.id,
    code: item.role.code,
    name: item.role.name,
  })),
  permissions: withKaderCheckupUpdatePermission(
    user.roles,
    [...new Set(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)))],
  ),
});

const findUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
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

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await findUserByEmail(email);

    if (!user) {
      throw new ApiError(401, 'Email atau password salah');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Akun tidak aktif');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, 'Email atau password salah');
    }

    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `${user.name} login ke sistem`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user: getUserPayload(user),
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated.body;
    const decoded = verifyRefreshToken(refreshToken);
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
      throw new ApiError(401, 'Refresh token tidak valid');
    }

    res.json({
      success: true,
      data: {
        accessToken: signAccessToken({ sub: user.id }),
        refreshToken: signRefreshToken({ sub: user.id }),
        user: getUserPayload(user),
      },
    });
  } catch (error) {
    next(new ApiError(401, 'Refresh token tidak valid'));
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    res.json({ success: true, data: getUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await writeAuditLog({
      userId: req.user?.id,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user?.id,
      description: `${req.user?.name || 'User'} logout dari sistem`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: { message: 'Logout berhasil' } });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validated.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new ApiError(404, 'User tidak ditemukan');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiError(422, 'Password saat ini salah');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });

    await writeAuditLog({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      description: `${user.name} mengubah password`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: { message: 'Password berhasil diubah' } });
  } catch (error) {
    next(error);
  }
};
