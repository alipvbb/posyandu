import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { ensureVillageAccess, getActorVillageId } from '../../utils/village-scope.js';

const sanitizeCodePart = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);

const createUniqueCode = async (model, baseCode) => {
  const base = sanitizeCodePart(baseCode) || `CODE-${Date.now()}`;
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await model.findUnique({ where: { code: candidate }, select: { id: true } });
    if (!exists) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const requireVillageContext = (req) => {
  const actorVillageId = getActorVillageId(req.user);
  if (actorVillageId === null) {
    throw new ApiError(400, 'Aksi ini membutuhkan konteks desa dari akun yang login');
  }
  return actorVillageId;
};

const mapPrismaError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return new ApiError(409, 'Kode atau nama sudah dipakai');
    if (error.code === 'P2003') return new ApiError(409, 'Data masih dipakai relasi lain');
  }
  return error;
};

export const listHamlets = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const search = req.query.search?.trim();
    const items = await prisma.hamlet.findMany({
      where: {
        ...(actorVillageId === null ? {} : { villageId: actorVillageId }),
        ...(search ? { name: { contains: search } } : {}),
      },
      include: {
        _count: {
          select: {
            rws: true,
            posyandus: true,
            families: true,
            toddlers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createHamlet = async (req, res, next) => {
  try {
    const villageId = requireVillageContext(req);
    const village = await prisma.village.findUnique({
      where: { id: villageId },
      select: { id: true, code: true },
    });
    if (!village) throw new ApiError(404, 'Desa tidak ditemukan');

    const code = await createUniqueCode(prisma.hamlet, `${village.code}-HML-${req.validated.body.name}`);
    const item = await prisma.hamlet.create({
      data: {
        villageId,
        name: req.validated.body.name,
        code,
      },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE_HAMLET',
      entityType: 'Hamlet',
      entityId: item.id,
      description: `Menambah dusun ${item.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const updateHamlet = async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const item = await prisma.hamlet.findUnique({ where: { id } });
    if (!item) throw new ApiError(404, 'Dusun tidak ditemukan');
    ensureVillageAccess(req.user, item.villageId, 'Anda hanya dapat mengelola dusun desa Anda');

    const updated = await prisma.hamlet.update({
      where: { id },
      data: { name: req.validated.body.name },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE_HAMLET',
      entityType: 'Hamlet',
      entityId: updated.id,
      description: `Memperbarui dusun ${updated.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const deleteHamlet = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.hamlet.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rws: true, posyandus: true, families: true, toddlers: true },
        },
      },
    });
    if (!item) throw new ApiError(404, 'Dusun tidak ditemukan');
    ensureVillageAccess(req.user, item.villageId, 'Anda hanya dapat mengelola dusun desa Anda');
    if (item._count.rws || item._count.posyandus || item._count.families || item._count.toddlers) {
      throw new ApiError(409, 'Dusun tidak bisa dihapus karena masih dipakai data lain');
    }

    await prisma.hamlet.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Dusun berhasil dihapus' } });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const listRws = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const hamletId = req.query.hamletId ? Number(req.query.hamletId) : null;
    const search = req.query.search?.trim();
    const items = await prisma.rW.findMany({
      where: {
        ...(search ? { name: { contains: search } } : {}),
        ...(hamletId ? { hamletId } : {}),
        ...(actorVillageId === null ? {} : { hamlet: { is: { villageId: actorVillageId } } }),
      },
      include: {
        hamlet: true,
        _count: {
          select: { rts: true, families: true, toddlers: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createRw = async (req, res, next) => {
  try {
    const actorVillageId = requireVillageContext(req);
    const hamlet = await prisma.hamlet.findUnique({
      where: { id: req.validated.body.hamletId },
      select: { id: true, code: true, villageId: true },
    });
    if (!hamlet) throw new ApiError(404, 'Dusun tidak ditemukan');
    ensureVillageAccess(req.user, hamlet.villageId, 'Anda hanya dapat memilih dusun desa Anda');

    const code = await createUniqueCode(prisma.rW, `${hamlet.code}-RW-${req.validated.body.name}`);
    const item = await prisma.rW.create({
      data: {
        hamletId: hamlet.id,
        name: req.validated.body.name,
        code,
      },
      include: { hamlet: true },
    });
    if (actorVillageId !== hamlet.villageId) throw new ApiError(403, 'Akses ditolak');
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const updateRw = async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const existing = await prisma.rW.findUnique({
      where: { id },
      include: { hamlet: true },
    });
    if (!existing) throw new ApiError(404, 'RW tidak ditemukan');
    ensureVillageAccess(req.user, existing.hamlet.villageId, 'Anda hanya dapat mengelola RW desa Anda');

    let nextHamletId = existing.hamletId;
    if (req.validated.body.hamletId) {
      const hamlet = await prisma.hamlet.findUnique({
        where: { id: req.validated.body.hamletId },
        select: { id: true, villageId: true },
      });
      if (!hamlet) throw new ApiError(404, 'Dusun tidak ditemukan');
      ensureVillageAccess(req.user, hamlet.villageId, 'Anda hanya dapat memindahkan RW ke dusun desa Anda');
      nextHamletId = hamlet.id;
    }

    const updated = await prisma.rW.update({
      where: { id },
      data: {
        hamletId: nextHamletId,
        ...(req.validated.body.name ? { name: req.validated.body.name } : {}),
      },
      include: { hamlet: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const deleteRw = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.rW.findUnique({
      where: { id },
      include: {
        hamlet: true,
        _count: { select: { rts: true, families: true, toddlers: true } },
      },
    });
    if (!item) throw new ApiError(404, 'RW tidak ditemukan');
    ensureVillageAccess(req.user, item.hamlet.villageId, 'Anda hanya dapat mengelola RW desa Anda');
    if (item._count.rts || item._count.families || item._count.toddlers) {
      throw new ApiError(409, 'RW tidak bisa dihapus karena masih dipakai data lain');
    }

    await prisma.rW.delete({ where: { id } });
    res.json({ success: true, data: { message: 'RW berhasil dihapus' } });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const listRts = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const rwId = req.query.rwId ? Number(req.query.rwId) : null;
    const search = req.query.search?.trim();
    const items = await prisma.rT.findMany({
      where: {
        ...(search ? { name: { contains: search } } : {}),
        ...(rwId ? { rwId } : {}),
        ...(actorVillageId === null ? {} : { rw: { is: { hamlet: { villageId: actorVillageId } } } }),
      },
      include: {
        rw: {
          include: { hamlet: true },
        },
        _count: { select: { families: true, toddlers: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createRt = async (req, res, next) => {
  try {
    const name = String(req.validated.body.name || '').trim();
    const rw = await prisma.rW.findUnique({
      where: { id: req.validated.body.rwId },
      include: { hamlet: true },
    });
    if (!rw) throw new ApiError(404, 'RW tidak ditemukan');
    ensureVillageAccess(req.user, rw.hamlet.villageId, 'Anda hanya dapat memilih RW desa Anda');

    const duplicate = await prisma.rT.findFirst({
      where: {
        rwId: rw.id,
        name,
      },
      select: { id: true },
    });
    if (duplicate) throw new ApiError(409, 'Nama RT sudah ada pada RW ini');

    const code = await createUniqueCode(prisma.rT, `${rw.code}-RT-${name}`);
    const item = await prisma.rT.create({
      data: {
        rwId: rw.id,
        name,
        code,
      },
      include: { rw: { include: { hamlet: true } } },
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const updateRt = async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const existing = await prisma.rT.findUnique({
      where: { id },
      include: { rw: { include: { hamlet: true } } },
    });
    if (!existing) throw new ApiError(404, 'RT tidak ditemukan');
    ensureVillageAccess(req.user, existing.rw.hamlet.villageId, 'Anda hanya dapat mengelola RT desa Anda');

    let nextRwId = existing.rwId;
    if (req.validated.body.rwId) {
      const rw = await prisma.rW.findUnique({
        where: { id: req.validated.body.rwId },
        include: { hamlet: true },
      });
      if (!rw) throw new ApiError(404, 'RW tidak ditemukan');
      ensureVillageAccess(req.user, rw.hamlet.villageId, 'Anda hanya dapat memindahkan RT ke RW desa Anda');
      nextRwId = rw.id;
    }

    const nextName = String(req.validated.body.name || existing.name).trim();
    const duplicate = await prisma.rT.findFirst({
      where: {
        id: { not: id },
        rwId: nextRwId,
        name: nextName,
      },
      select: { id: true },
    });
    if (duplicate) throw new ApiError(409, 'Nama RT sudah ada pada RW ini');

    const updated = await prisma.rT.update({
      where: { id },
      data: {
        rwId: nextRwId,
        ...(req.validated.body.name ? { name: nextName } : {}),
      },
      include: { rw: { include: { hamlet: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const deleteRt = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.rT.findUnique({
      where: { id },
      include: {
        rw: { include: { hamlet: true } },
        _count: { select: { families: true, toddlers: true } },
      },
    });
    if (!item) throw new ApiError(404, 'RT tidak ditemukan');
    ensureVillageAccess(req.user, item.rw.hamlet.villageId, 'Anda hanya dapat mengelola RT desa Anda');
    if (item._count.families || item._count.toddlers) {
      throw new ApiError(409, 'RT tidak bisa dihapus karena masih dipakai data lain');
    }

    await prisma.rT.delete({ where: { id } });
    res.json({ success: true, data: { message: 'RT berhasil dihapus' } });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const listPosyandus = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const hamletId = req.query.hamletId ? Number(req.query.hamletId) : null;
    const search = req.query.search?.trim();
    const items = await prisma.posyandu.findMany({
      where: {
        ...(actorVillageId === null ? {} : { villageId: actorVillageId }),
        ...(hamletId ? { hamletId } : {}),
        ...(search ? { name: { contains: search } } : {}),
      },
      include: {
        hamlet: true,
        _count: {
          select: {
            toddlers: true,
            checkups: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createPosyandu = async (req, res, next) => {
  try {
    const villageId = requireVillageContext(req);
    const hamlet = await prisma.hamlet.findUnique({
      where: { id: req.validated.body.hamletId },
      select: { id: true, villageId: true, code: true },
    });
    if (!hamlet) throw new ApiError(404, 'Dusun tidak ditemukan');
    ensureVillageAccess(req.user, hamlet.villageId, 'Anda hanya dapat memilih dusun desa Anda');

    const code = await createUniqueCode(prisma.posyandu, `${hamlet.code}-POS-${req.validated.body.name}`);
    const item = await prisma.posyandu.create({
      data: {
        villageId,
        hamletId: hamlet.id,
        name: req.validated.body.name,
        code,
        locationAddress: req.validated.body.locationAddress,
        scheduleDay: req.validated.body.scheduleDay,
        contactPhone: req.validated.body.contactPhone,
      },
      include: { hamlet: true },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const updatePosyandu = async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const existing = await prisma.posyandu.findUnique({
      where: { id },
      select: { id: true, villageId: true, hamletId: true },
    });
    if (!existing) throw new ApiError(404, 'Posyandu tidak ditemukan');
    ensureVillageAccess(req.user, existing.villageId, 'Anda hanya dapat mengelola posyandu desa Anda');

    let nextHamletId = existing.hamletId;
    if (req.validated.body.hamletId) {
      const hamlet = await prisma.hamlet.findUnique({
        where: { id: req.validated.body.hamletId },
        select: { id: true, villageId: true },
      });
      if (!hamlet) throw new ApiError(404, 'Dusun tidak ditemukan');
      ensureVillageAccess(req.user, hamlet.villageId, 'Anda hanya dapat memindahkan posyandu ke dusun desa Anda');
      nextHamletId = hamlet.id;
    }

    const updated = await prisma.posyandu.update({
      where: { id },
      data: {
        hamletId: nextHamletId,
        ...(req.validated.body.name !== undefined ? { name: req.validated.body.name } : {}),
        ...(req.validated.body.locationAddress !== undefined
          ? { locationAddress: req.validated.body.locationAddress }
          : {}),
        ...(req.validated.body.scheduleDay !== undefined ? { scheduleDay: req.validated.body.scheduleDay } : {}),
        ...(req.validated.body.contactPhone !== undefined ? { contactPhone: req.validated.body.contactPhone } : {}),
      },
      include: { hamlet: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const deletePosyandu = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.posyandu.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            toddlers: true,
            checkups: true,
          },
        },
      },
    });
    if (!item) throw new ApiError(404, 'Posyandu tidak ditemukan');
    ensureVillageAccess(req.user, item.villageId, 'Anda hanya dapat mengelola posyandu desa Anda');
    if (item._count.toddlers || item._count.checkups) {
      throw new ApiError(409, 'Posyandu tidak bisa dihapus karena masih dipakai data lain');
    }

    await prisma.posyandu.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Posyandu berhasil dihapus' } });
  } catch (error) {
    next(mapPrismaError(error));
  }
};
