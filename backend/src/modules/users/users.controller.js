import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { buildMeta, buildPagination } from '../../utils/pagination.js';

const userInclude = {
  village: true,
  roles: {
    include: {
      role: true,
    },
  },
};

const mapUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  village: user.village
    ? {
        id: user.village.id,
        name: user.village.name,
        code: user.village.code,
      }
    : null,
  roles: user.roles.map((item) => item.role),
});

const resolveRoles = async ({ roleIds, roleCodes }) => {
  if (roleIds?.length) {
    return prisma.role.findMany({ where: { id: { in: roleIds } } });
  }

  if (roleCodes?.length) {
    return prisma.role.findMany({ where: { code: { in: roleCodes } } });
  }

  return [];
};

const isVillageScopedUser = (reqUser) => Boolean(reqUser?.villageId);

const ensureSameVillageAccess = (reqUser, targetVillageId) => {
  if (!isVillageScopedUser(reqUser)) return;
  if (targetVillageId !== reqUser.villageId) {
    throw new ApiError(403, 'Anda hanya dapat mengelola user pada desa Anda');
  }
};

const resolveTargetVillageId = (reqUser, payloadVillageId) => {
  if (isVillageScopedUser(reqUser)) {
    if (payloadVillageId && payloadVillageId !== reqUser.villageId) {
      throw new ApiError(403, 'Anda hanya dapat mengelola user pada desa Anda');
    }
    return reqUser.villageId;
  }

  if (payloadVillageId) return payloadVillageId;
  return null;
};

export const listUsers = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = buildPagination(req.query);
    const search = req.query.search?.trim();
    const where = {
      ...(isVillageScopedUser(req.user) ? { villageId: req.user.villageId } : {}),
      ...(search
        ? {
            OR: [{ name: { contains: search } }, { email: { contains: search } }],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users.map(mapUser),
      meta: buildMeta({ page, pageSize, total }),
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, status, roleIds, roleCodes, villageId } = req.validated.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'Email sudah digunakan');
    }

    const targetVillageId = resolveTargetVillageId(req.user, villageId);
    const roles = await resolveRoles({ roleIds, roleCodes });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        status,
        villageId: targetVillageId,
        passwordHash: await bcrypt.hash(password, 10),
        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
          })),
        },
      },
      include: userInclude,
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      description: `Membuat user ${user.email}`,
      meta: { createdUserId: user.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const payload = req.validated.body;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'User tidak ditemukan');
    }

    ensureSameVillageAccess(req.user, existing.villageId);

    const roles = await resolveRoles(payload);
    const data = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      ...(payload.villageId !== undefined
        ? {
            villageId: resolveTargetVillageId(req.user, payload.villageId || undefined),
          }
        : {}),
    };

    if (payload.password) {
      data.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    const user = await prisma.$transaction(async (tx) => {
      if (payload.roleIds || payload.roleCodes) {
        await tx.userRole.deleteMany({ where: { userId: id } });
      }

      return tx.user.update({
        where: { id },
        data: {
          ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
          ...(payload.roleIds || payload.roleCodes
            ? {
                roles: {
                  create: roles.map((role) => ({ roleId: role.id })),
                },
              }
            : {}),
        },
        include: userInclude,
      });
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user.id,
      description: `Memperbarui user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'User tidak ditemukan');

    ensureSameVillageAccess(req.user, user.villageId);

    await prisma.user.delete({ where: { id } });
    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: id,
      description: `Menghapus user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: { message: 'User dihapus' } });
  } catch (error) {
    next(error);
  }
};
