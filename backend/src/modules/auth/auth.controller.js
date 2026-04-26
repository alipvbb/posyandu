import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLES, ROLE_PERMISSION_MAP, SYSTEM_PERMISSIONS } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { sendPasswordResetEmail, sendRegisterVerificationEmail } from '../../services/mail.service.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { extractCustomPermissionCodes, resolveEffectiveUserPermissions } from '../../utils/user-permissions.js';

const userAuthInclude = {
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
};

const getUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status,
  village: user.village
    ? {
        id: user.village.id,
        name: user.village.name,
        code: user.village.code,
      }
    : null,
  roles: user.roles.map((item) => ({
    id: item.role.id,
    code: item.role.code,
    name: item.role.name,
  })),
  useCustomPermissions: Boolean(user.useCustomPermissions),
  customPermissionCodes: extractCustomPermissionCodes(user),
  permissions: resolveEffectiveUserPermissions(user),
});

const findUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
    include: userAuthInclude,
  });

const normalizeVillageCode = (value) => {
  const raw = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return raw || `DESA-${Date.now()}`;
};

const createUniqueVillageCode = async (tx, villageName, requestedCode) => {
  const base = normalizeVillageCode(requestedCode || villageName);
  let candidate = base;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await tx.village.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const ensureAuthBaseline = async (tx) => {
  const permissionMap = {};
  for (const permission of SYSTEM_PERMISSIONS) {
    const saved = await tx.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.name,
      },
      create: {
        code: permission.code,
        name: permission.name,
        description: permission.name,
      },
    });
    permissionMap[permission.code] = saved.id;
  }

  const roleMap = {};
  for (const roleSeed of DEFAULT_ROLES) {
    const role = await tx.role.upsert({
      where: { code: roleSeed.code },
      update: {
        name: roleSeed.name,
        description: `Role ${roleSeed.name}`,
      },
      create: {
        code: roleSeed.code,
        name: roleSeed.name,
        description: `Role ${roleSeed.name}`,
      },
    });
    roleMap[role.code] = role;

    for (const permissionCode of ROLE_PERMISSION_MAP[role.code] || []) {
      const permissionId = permissionMap[permissionCode];
      if (!permissionId) continue;

      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }

  return roleMap;
};

const createStarterMasterData = async (tx, village) => {
  const hamlet = await tx.hamlet.create({
    data: {
      villageId: village.id,
      name: 'Dusun Utama',
      code: `${village.code}-H1`,
    },
  });

  const rw = await tx.rW.create({
    data: {
      hamletId: hamlet.id,
      name: 'RW 01',
      code: `${village.code}-RW1`,
    },
  });

  const rt = await tx.rT.create({
    data: {
      rwId: rw.id,
      name: 'RT 01',
      code: `${village.code}-RT1`,
    },
  });

  await tx.posyandu.create({
    data: {
      villageId: village.id,
      hamletId: hamlet.id,
      name: 'Posyandu Utama',
      code: `${village.code}-POS1`,
      locationAddress: village.name,
      scheduleDay: 'Tanggal 1-10',
    },
  });

  return { hamlet, rw, rt };
};

const hashVerificationCode = (plainCode) => crypto.createHash('sha256').update(plainCode).digest('hex');
const REGISTER_CODE_TTL_MINUTES = 15;
const REGISTER_RESEND_COOLDOWN_SECONDS = 60;
const RESET_CODE_TTL_MINUTES = 15;
const RESET_RESEND_COOLDOWN_SECONDS = 60;

const issueRegisterCode = async (tx, userId) => {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + REGISTER_CODE_TTL_MINUTES * 60 * 1000);

  await tx.userVerificationCode.updateMany({
    where: {
      userId,
      purpose: 'REGISTER',
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await tx.userVerificationCode.create({
    data: {
      userId,
      codeHash,
      purpose: 'REGISTER',
      expiresAt,
    },
  });

  return code;
};

const issueResetPasswordCode = async (tx, userId) => {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);

  await tx.userVerificationCode.updateMany({
    where: {
      userId,
      purpose: 'RESET_PASSWORD',
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await tx.userVerificationCode.create({
    data: {
      userId,
      codeHash,
      purpose: 'RESET_PASSWORD',
      expiresAt,
    },
  });

  return code;
};

const getLatestActiveRegisterCode = (userId) =>
  prisma.userVerificationCode.findFirst({
    where: {
      userId,
      purpose: 'REGISTER',
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

const getLatestActiveResetCode = (userId) =>
  prisma.userVerificationCode.findFirst({
    where: {
      userId,
      purpose: 'RESET_PASSWORD',
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

export const register = async (req, res, next) => {
  try {
    const { villageName, villageCode, adminName, email, phone, password } = req.validated.body;
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ApiError(409, 'Email sudah digunakan');
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const roleMap = await ensureAuthBaseline(tx);
      const adminRole = roleMap.admin;
      if (!adminRole) {
        throw new ApiError(500, 'Role admin belum tersedia');
      }

      const code = await createUniqueVillageCode(tx, villageName, villageCode);
      const village = await tx.village.create({
        data: {
          name: villageName,
          code,
        },
      });

      await createStarterMasterData(tx, village);

      const user = await tx.user.create({
        data: {
          name: adminName,
          email,
          phone,
          passwordHash: await bcrypt.hash(password, 10),
          status: 'INACTIVE',
          villageId: village.id,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      const verificationCode = await issueRegisterCode(tx, user.id);

      return { user, village, verificationCode };
    });

    const delivery = await sendRegisterVerificationEmail({
      to: email,
      name: adminName,
      code: txResult.verificationCode,
      villageName: txResult.village.name,
    });

    res.status(201).json({
      success: true,
      data: {
        email,
        village: {
          id: txResult.village.id,
          name: txResult.village.name,
          code: txResult.village.code,
        },
        requiresVerification: true,
        expiresInMinutes: REGISTER_CODE_TTL_MINUTES,
        delivery: delivery.sent ? 'email' : 'mock',
        ...(delivery.mocked && env.nodeEnv !== 'production' ? { debugCode: txResult.verificationCode } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendRegisterCode = async (req, res, next) => {
  try {
    const { email } = req.validated.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { village: true },
    });

    if (!user) {
      throw new ApiError(404, 'Akun tidak ditemukan');
    }

    if (user.status === 'ACTIVE') {
      throw new ApiError(409, 'Akun sudah aktif. Silakan login.');
    }

    const latestCode = await getLatestActiveRegisterCode(user.id);
    if (latestCode) {
      const secondsSinceLastCode = Math.floor((Date.now() - latestCode.createdAt.getTime()) / 1000);
      if (secondsSinceLastCode < REGISTER_RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = REGISTER_RESEND_COOLDOWN_SECONDS - secondsSinceLastCode;
        throw new ApiError(429, `Tunggu ${waitSeconds} detik sebelum kirim ulang kode.`);
      }
    }

    const verificationCode = await prisma.$transaction(async (tx) => issueRegisterCode(tx, user.id));
    const delivery = await sendRegisterVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      villageName: user.village?.name || 'Desa',
    });

    await writeAuditLog({
      userId: user.id,
      action: 'RESEND_REGISTER_CODE',
      entityType: 'User',
      entityId: user.id,
      description: `${user.name} meminta kirim ulang kode verifikasi`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        email: user.email,
        expiresInMinutes: REGISTER_CODE_TTL_MINUTES,
        cooldownSeconds: REGISTER_RESEND_COOLDOWN_SECONDS,
        delivery: delivery.sent ? 'email' : 'mock',
        ...(delivery.mocked && env.nodeEnv !== 'production' ? { debugCode: verificationCode } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRegister = async (req, res, next) => {
  try {
    const { email, code } = req.validated.body;
    const user = await findUserByEmail(email);

    if (!user) {
      throw new ApiError(404, 'Akun tidak ditemukan');
    }

    if (user.status === 'ACTIVE') {
      throw new ApiError(409, 'Akun sudah aktif. Silakan login.');
    }

    const verification = await prisma.userVerificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'REGISTER',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new ApiError(422, 'Kode verifikasi tidak valid atau sudah kadaluarsa');
    }

    const validCode = verification.codeHash === hashVerificationCode(String(code).trim());
    if (!validCode) {
      throw new ApiError(422, 'Kode verifikasi salah');
    }

    await prisma.$transaction([
      prisma.userVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          lastLoginAt: new Date(),
        },
      }),
    ]);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: userAuthInclude,
    });

    const accessToken = signAccessToken({ sub: refreshedUser.id });
    const refreshToken = signRefreshToken({ sub: refreshedUser.id });

    await writeAuditLog({
      userId: refreshedUser.id,
      action: 'VERIFY_REGISTER',
      entityType: 'User',
      entityId: refreshedUser.id,
      description: `${refreshedUser.name} verifikasi email pendaftaran`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user: getUserPayload(refreshedUser),
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

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await findUserByEmail(email);

    if (!user) {
      throw new ApiError(401, 'Email atau password salah');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Akun belum aktif. Silakan verifikasi email terlebih dahulu.');
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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validated.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { village: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.json({
        success: true,
        data: {
          message: 'Jika email terdaftar, kode reset password akan dikirim.',
          expiresInMinutes: RESET_CODE_TTL_MINUTES,
          cooldownSeconds: RESET_RESEND_COOLDOWN_SECONDS,
        },
      });
      return;
    }

    const latestCode = await getLatestActiveResetCode(user.id);
    if (latestCode) {
      const secondsSinceLastCode = Math.floor((Date.now() - latestCode.createdAt.getTime()) / 1000);
      if (secondsSinceLastCode < RESET_RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = RESET_RESEND_COOLDOWN_SECONDS - secondsSinceLastCode;
        throw new ApiError(429, `Tunggu ${waitSeconds} detik sebelum kirim ulang kode reset.`);
      }
    }

    const resetCode = await prisma.$transaction(async (tx) => issueResetPasswordCode(tx, user.id));
    const delivery = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      code: resetCode,
      villageName: user.village?.name || 'Desa',
    });

    if (!delivery.sent) {
      throw new ApiError(503, 'Kode reset gagal dikirim ke email. Periksa konfigurasi SMTP admin.');
    }

    await writeAuditLog({
      userId: user.id,
      action: 'FORGOT_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      description: `${user.name} meminta kode reset password`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        message: 'Jika email terdaftar, kode reset password akan dikirim.',
        expiresInMinutes: RESET_CODE_TTL_MINUTES,
        cooldownSeconds: RESET_RESEND_COOLDOWN_SECONDS,
        delivery: 'email',
        ...(delivery.mocked && env.nodeEnv !== 'production' ? { debugCode: resetCode } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.validated.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(422, 'Email atau kode reset tidak valid');
    }

    const verification = await prisma.userVerificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'RESET_PASSWORD',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new ApiError(422, 'Kode reset tidak valid atau sudah kadaluarsa');
    }

    const validCode = verification.codeHash === hashVerificationCode(String(code).trim());
    if (!validCode) {
      throw new ApiError(422, 'Kode reset salah');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(newPassword, 10) },
      }),
      prisma.userVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: new Date() },
      }),
      prisma.userVerificationCode.updateMany({
        where: {
          userId: user.id,
          purpose: 'RESET_PASSWORD',
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      }),
    ]);

    await writeAuditLog({
      userId: user.id,
      action: 'RESET_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      description: `${user.name} melakukan reset password`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: { message: 'Password berhasil direset. Silakan login.' } });
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
      include: userAuthInclude,
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
  } catch (_error) {
    next(new ApiError(401, 'Refresh token tidak valid'));
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: userAuthInclude,
    });

    if (!user) {
      throw new ApiError(404, 'User tidak ditemukan');
    }

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
