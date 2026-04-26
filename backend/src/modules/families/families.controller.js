import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { buildMeta, buildPagination } from '../../utils/pagination.js';
import { ensureVillageAccess, getActorVillageId } from '../../utils/village-scope.js';

const familyInclude = {
  village: true,
  hamlet: true,
  rw: true,
  rt: true,
  members: {
    orderBy: { id: 'asc' },
  },
  _count: {
    select: {
      mothers: true,
      fathers: true,
      members: true,
      toddlers: true,
    },
  },
};

const serializeFamily = (item) => ({
  id: item.id,
  villageId: item.villageId,
  hamletId: item.hamletId,
  rwId: item.rwId,
  rtId: item.rtId,
  domicileProvinceCode: item.domicileProvinceCode,
  domicileProvinceName: item.domicileProvinceName,
  domicileRegencyCode: item.domicileRegencyCode,
  domicileRegencyName: item.domicileRegencyName,
  domicileDistrictCode: item.domicileDistrictCode,
  domicileDistrictName: item.domicileDistrictName,
  domicileVillageCode: item.domicileVillageCode,
  domicileVillageName: item.domicileVillageName,
  domicileRw: item.domicileRw,
  domicileRt: item.domicileRt,
  familyNumber: item.familyNumber,
  headName: item.headName,
  address: item.address,
  phone: item.phone,
  village: item.village,
  hamlet: item.hamlet,
  rw: item.rw,
  rt: item.rt,
  members:
    item.members?.map((member) => ({
      id: member.id,
      relationType: member.relationType,
      fullName: member.fullName,
      nik: member.nik,
      gender: member.gender,
      placeOfBirth: member.placeOfBirth,
      birthDate: member.birthDate,
      religion: member.religion,
      education: member.education,
      occupation: member.occupation,
      maritalStatus: member.maritalStatus,
      citizenship: member.citizenship,
      fatherName: member.fatherName,
      motherName: member.motherName,
      relationshipStatus: member.relationshipStatus,
    })) || [],
  motherCount: item._count?.mothers || 0,
  fatherCount: item._count?.fathers || 0,
  memberCount: item._count?.members || 0,
  toddlerCount: item._count?.toddlers || 0,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const normalizeMemberRelation = (value) => String(value || '').trim().toUpperCase();

const normalizeFamilyMembers = (members = []) =>
  members
    .filter((item) => item?.fullName)
    .map((item) => ({
      relationType: normalizeMemberRelation(item.relationType),
      fullName: String(item.fullName || '').trim(),
      nik: item.nik || null,
      gender: item.gender,
      placeOfBirth: item.placeOfBirth || null,
      birthDate: item.birthDate ? new Date(item.birthDate) : null,
      religion: item.religion || null,
      education: item.education || null,
      occupation: item.occupation || null,
      maritalStatus: item.maritalStatus || null,
      citizenship: item.citizenship || 'WNI',
      fatherName: item.fatherName || null,
      motherName: item.motherName || null,
      relationshipStatus: item.relationshipStatus || null,
    }));

const findFatherCandidate = (members) => {
  const priority = ['AYAH', 'SUAMI', 'KEPALA KELUARGA'];
  for (const relation of priority) {
    const member = members.find((item) => normalizeMemberRelation(item.relationType) === relation && item.gender === 'MALE');
    if (member) return member;
  }
  return null;
};

const findMotherCandidate = (members) => {
  const priority = ['IBU', 'ISTRI', 'KEPALA KELUARGA'];
  for (const relation of priority) {
    const member = members.find((item) => normalizeMemberRelation(item.relationType) === relation && item.gender === 'FEMALE');
    if (member) return member;
  }
  return null;
};

const syncSingleParent = async (tx, type, familyId, member, familyPhone) => {
  if (!member) return;

  const data = {
    familyId,
    fullName: member.fullName,
    nik: member.nik || null,
    birthDate: member.birthDate || null,
    education: member.education || null,
    occupation: member.occupation || null,
    phone: familyPhone || null,
  };

  const model = type === 'mother' ? tx.mother : tx.father;
  const existing = await model.findFirst({
    where: { familyId },
    orderBy: { id: 'asc' },
  });

  if (existing) {
    await model.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await model.create({ data });
  }
};

const syncParentMastersFromMembers = async (tx, familyId, members, familyPhone) => {
  const fatherCandidate = findFatherCandidate(members);
  const motherCandidate = findMotherCandidate(members);
  await syncSingleParent(tx, 'father', familyId, fatherCandidate, familyPhone);
  await syncSingleParent(tx, 'mother', familyId, motherCandidate, familyPhone);
};

const mapPrismaError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      if (String(error.meta?.target || '').includes('familyNumber')) return new ApiError(409, 'No KK sudah terdaftar');
      if (String(error.meta?.target || '').includes('nik')) return new ApiError(409, 'NIK sudah terdaftar');
      return new ApiError(409, 'Data unik sudah terdaftar');
    }
    if (error.code === 'P2003') return new ApiError(400, 'Relasi wilayah tidak valid (cek desa/dusun/rw/rt)');
  }
  return error;
};

export const listFamilies = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const { page, pageSize, skip, take } = buildPagination(req.query);
    const search = req.query.search?.trim();
    const order = String(req.query.order || '').trim().toLowerCase();
    const orderBy = order === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };
    const where = search
      ? {
          ...(actorVillageId === null ? {} : { villageId: actorVillageId }),
          OR: [
            { familyNumber: { contains: search } },
            { headName: { contains: search } },
            { address: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : actorVillageId === null
        ? {}
        : { villageId: actorVillageId };

    const [items, total] = await Promise.all([
      prisma.family.findMany({
        where,
        include: familyInclude,
        skip,
        take,
        orderBy,
      }),
      prisma.family.count({ where }),
    ]);

    res.json({ success: true, data: items.map(serializeFamily), meta: buildMeta({ page, pageSize, total }) });
  } catch (error) {
    next(error);
  }
};

export const createFamily = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const payload = req.validated.body;
    ensureVillageAccess(req.user, payload.villageId, 'Anda hanya dapat menambah Master KK pada desa Anda');
    const members = normalizeFamilyMembers(payload.members);
    const created = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          villageId: actorVillageId ?? payload.villageId,
          hamletId: payload.hamletId,
          rwId: payload.rwId,
          rtId: payload.rtId,
          domicileProvinceCode: payload.domicileProvinceCode,
          domicileProvinceName: payload.domicileProvinceName,
          domicileRegencyCode: payload.domicileRegencyCode,
          domicileRegencyName: payload.domicileRegencyName,
          domicileDistrictCode: payload.domicileDistrictCode,
          domicileDistrictName: payload.domicileDistrictName,
          domicileVillageCode: payload.domicileVillageCode,
          domicileVillageName: payload.domicileVillageName,
          domicileRw: payload.domicileRw,
          domicileRt: payload.domicileRt,
          familyNumber: payload.familyNumber,
          headName: payload.headName,
          address: payload.address,
          phone: payload.phone,
        },
      });

      if (members.length) {
        await tx.familyMember.createMany({
          data: members.map((item) => ({ ...item, familyId: family.id })),
        });
      }

      await syncParentMastersFromMembers(tx, family.id, members, payload.phone);

      return tx.family.findUnique({
        where: { id: family.id },
        include: familyInclude,
      });
    });
    if (!created) throw new ApiError(500, 'Gagal membuat master KK');

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE_FAMILY',
      entityType: 'Family',
      entityId: created.id,
      description: `Menambah master KK ${created.familyNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: serializeFamily(created) });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const updateFamily = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const id = req.validated.params.id;
    const payload = req.validated.body;
    const members = normalizeFamilyMembers(payload.members);
    const exists = await prisma.family.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, 'Master KK tidak ditemukan');
    ensureVillageAccess(req.user, exists.villageId, 'Anda hanya dapat mengubah Master KK pada desa Anda');
    ensureVillageAccess(req.user, payload.villageId, 'Anda hanya dapat mengubah Master KK pada desa Anda');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.family.update({
        where: { id },
        data: {
          villageId: actorVillageId ?? payload.villageId,
          hamletId: payload.hamletId,
          rwId: payload.rwId,
          rtId: payload.rtId,
          domicileProvinceCode: payload.domicileProvinceCode,
          domicileProvinceName: payload.domicileProvinceName,
          domicileRegencyCode: payload.domicileRegencyCode,
          domicileRegencyName: payload.domicileRegencyName,
          domicileDistrictCode: payload.domicileDistrictCode,
          domicileDistrictName: payload.domicileDistrictName,
          domicileVillageCode: payload.domicileVillageCode,
          domicileVillageName: payload.domicileVillageName,
          domicileRw: payload.domicileRw,
          domicileRt: payload.domicileRt,
          familyNumber: payload.familyNumber,
          headName: payload.headName,
          address: payload.address,
          phone: payload.phone,
        },
      });

      await tx.familyMember.deleteMany({ where: { familyId: id } });
      if (members.length) {
        await tx.familyMember.createMany({
          data: members.map((item) => ({ ...item, familyId: id })),
        });
      }

      await syncParentMastersFromMembers(tx, id, members, payload.phone);

      return tx.family.findUnique({
        where: { id },
        include: familyInclude,
      });
    });
    if (!updated) throw new ApiError(500, 'Gagal memperbarui master KK');

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE_FAMILY',
      entityType: 'Family',
      entityId: updated.id,
      description: `Memperbarui master KK ${updated.familyNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: serializeFamily(updated) });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const deleteFamily = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        _count: {
          select: { toddlers: true, members: true },
        },
      },
    });

    if (!family) throw new ApiError(404, 'Master KK tidak ditemukan');
    ensureVillageAccess(req.user, family.villageId, 'Anda hanya dapat menghapus Master KK pada desa Anda');
    if (family._count.toddlers > 0) {
      throw new ApiError(409, 'KK tidak bisa dihapus karena masih dipakai data balita');
    }

    await prisma.family.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE_FAMILY',
      entityType: 'Family',
      entityId: id,
      description: `Menghapus master KK ${family.familyNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: { message: 'Master KK berhasil dihapus' } });
  } catch (error) {
    next(mapPrismaError(error));
  }
};
