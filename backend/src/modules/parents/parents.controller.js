import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { buildMeta, buildPagination } from '../../utils/pagination.js';

const PARENT_MODEL_MAP = {
  mother: prisma.mother,
  father: prisma.father,
};

const PARENT_LABEL_MAP = {
  mother: 'Ibu',
  father: 'Ayah',
};

const resolveParentModel = (type) => {
  const normalized = String(type || '').toLowerCase();
  const model = PARENT_MODEL_MAP[normalized];
  if (!model) throw new ApiError(400, 'Tipe orang tua tidak valid');
  return {
    model,
    type: normalized,
    label: PARENT_LABEL_MAP[normalized],
  };
};

const serializeParent = (item, parentType) => ({
  id: item.id,
  parentType,
  familyId: item.familyId,
  fullName: item.fullName,
  nik: item.nik,
  birthDate: item.birthDate,
  education: item.education,
  occupation: item.occupation,
  phone: item.phone,
  family: item.family
    ? {
        id: item.family.id,
        familyNumber: item.family.familyNumber,
        headName: item.family.headName,
      }
    : null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const normalizePayload = (payload) => ({
  fullName: payload.fullName,
  nik: payload.nik,
  birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
  education: payload.education,
  occupation: payload.occupation,
  phone: payload.phone,
});

const resolveFamilyId = async (payload) => {
  if (payload.familyId) {
    const family = await prisma.family.findUnique({
      where: { id: Number(payload.familyId) },
      select: { id: true },
    });
    if (!family) throw new ApiError(404, 'Master Kartu Keluarga tidak ditemukan');
    return family.id;
  }

  if (payload.familyNumber) {
    const family = await prisma.family.findUnique({
      where: { familyNumber: payload.familyNumber },
      select: { id: true },
    });
    if (!family) throw new ApiError(404, 'Master Kartu Keluarga tidak ditemukan');
    return family.id;
  }

  throw new ApiError(422, 'No KK wajib dipilih dari Master Kartu Keluarga');
};

const handlePrismaWriteError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ApiError(409, 'NIK sudah digunakan orang tua lain');
    }
    if (error.code === 'P2003') {
      throw new ApiError(400, 'Relasi data tidak valid (cek keluarga)');
    }
  }
  throw error;
};

export const listParents = (parentType) => async (req, res, next) => {
  try {
    const { model, type } = resolveParentModel(parentType);
    const { page, pageSize, skip, take } = buildPagination(req.query);
    const search = req.query.search?.trim();
    const familyId = req.query.familyId ? Number(req.query.familyId) : null;
    const familyNumber = req.query.familyNumber?.trim();

    const where = {
      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { nik: { contains: search } },
              { phone: { contains: search } },
              { family: { is: { familyNumber: { contains: search } } } },
              { family: { is: { headName: { contains: search } } } },
            ],
          }
        : {}),
      ...(familyId || familyNumber
        ? {
            family: {
              is: {
                ...(familyId ? { id: familyId } : {}),
                ...(familyNumber ? { familyNumber: { contains: familyNumber } } : {}),
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        include: {
          family: {
            select: {
              id: true,
              familyNumber: true,
              headName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      model.count({ where }),
    ]);

    res.json({
      success: true,
      data: items.map((item) => serializeParent(item, type)),
      meta: buildMeta({ page, pageSize, total }),
    });
  } catch (error) {
    next(error);
  }
};

export const createParent = (parentType) => async (req, res, next) => {
  try {
    const { model, type, label } = resolveParentModel(parentType);
    const familyId = await resolveFamilyId(req.validated.body);
    const payload = {
      ...normalizePayload(req.validated.body),
      familyId,
    };

    const existingAtFamily = await model.findFirst({
      where: { familyId },
      select: { id: true },
    });
    if (existingAtFamily) {
      throw new ApiError(409, `${label} untuk No KK ini sudah ada. Gunakan edit.`);
    }

    const created = await model.create({
      data: payload,
      include: {
        family: {
          select: {
            id: true,
            familyNumber: true,
            headName: true,
          },
        },
      },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: `CREATE_PARENT_${type.toUpperCase()}`,
      entityType: label,
      entityId: created.id,
      description: `Menambah master ${label.toLowerCase()} ${created.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: serializeParent(created, type),
    });
  } catch (error) {
    try {
      handlePrismaWriteError(error);
    } catch (mappedError) {
      return next(mappedError);
    }
    next(error);
  }
};

export const updateParent = (parentType) => async (req, res, next) => {
  try {
    const { model, type, label } = resolveParentModel(parentType);
    const id = req.validated.params.id;
    const familyId = await resolveFamilyId(req.validated.body);
    const payload = {
      ...normalizePayload(req.validated.body),
      familyId,
    };

    const exists = await model.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, `${label} tidak ditemukan`);

    const duplicateAtFamily = await model.findFirst({
      where: {
        familyId,
        id: { not: id },
      },
      select: { id: true },
    });
    if (duplicateAtFamily) {
      throw new ApiError(409, `${label} untuk No KK ini sudah ada. Gunakan edit data yang ada.`);
    }

    const updated = await model.update({
      where: { id },
      data: payload,
      include: {
        family: {
          select: {
            id: true,
            familyNumber: true,
            headName: true,
          },
        },
      },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: `UPDATE_PARENT_${type.toUpperCase()}`,
      entityType: label,
      entityId: updated.id,
      description: `Memperbarui master ${label.toLowerCase()} ${updated.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: serializeParent(updated, type),
    });
  } catch (error) {
    try {
      handlePrismaWriteError(error);
    } catch (mappedError) {
      return next(mappedError);
    }
    next(error);
  }
};

export const deleteParent = (parentType) => async (req, res, next) => {
  try {
    const { model, type, label } = resolveParentModel(parentType);
    const id = Number(req.params.id);

    const exists = await model.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, `${label} tidak ditemukan`);

    await model.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user.id,
      action: `DELETE_PARENT_${type.toUpperCase()}`,
      entityType: label,
      entityId: id,
      description: `Menghapus master ${label.toLowerCase()} ${exists.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: { message: `${label} berhasil dihapus` },
    });
  } catch (error) {
    next(error);
  }
};
