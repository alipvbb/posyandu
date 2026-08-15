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

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const trimOrNull = (value) => {
  const text = String(value || '').trim();
  return text || null;
};

const maskIdentifier = (value) => {
  const digits = digitsOnly(value);
  if (!digits) return '-';
  return `****${digits.slice(-4)}`;
};

const normalizeFamilyPayload = (payload) => ({
  ...payload,
  familyNumber: digitsOnly(payload.familyNumber),
  headName: String(payload.headName || '').trim(),
  address: String(payload.address || '').trim(),
  phone: trimOrNull(payload.phone),
  domicileProvinceCode: trimOrNull(payload.domicileProvinceCode),
  domicileProvinceName: trimOrNull(payload.domicileProvinceName),
  domicileRegencyCode: trimOrNull(payload.domicileRegencyCode),
  domicileRegencyName: trimOrNull(payload.domicileRegencyName),
  domicileDistrictCode: trimOrNull(payload.domicileDistrictCode),
  domicileDistrictName: trimOrNull(payload.domicileDistrictName),
  domicileVillageCode: trimOrNull(payload.domicileVillageCode),
  domicileVillageName: trimOrNull(payload.domicileVillageName),
  domicileRw: trimOrNull(payload.domicileRw),
  domicileRt: trimOrNull(payload.domicileRt),
});

const normalizeFamilyMembers = (members = []) =>
  members
    .filter((item) => item?.fullName)
    .map((item) => ({
      relationType: normalizeMemberRelation(item.relationType),
      fullName: String(item.fullName || '').trim(),
      nik: digitsOnly(item.nik) || null,
      gender: item.gender,
      placeOfBirth: trimOrNull(item.placeOfBirth),
      birthDate: item.birthDate ? new Date(item.birthDate) : null,
      religion: trimOrNull(item.religion),
      education: trimOrNull(item.education),
      occupation: trimOrNull(item.occupation),
      maritalStatus: trimOrNull(item.maritalStatus),
      citizenship: trimOrNull(item.citizenship) || 'WNI',
      fatherName: trimOrNull(item.fatherName),
      motherName: trimOrNull(item.motherName),
      relationshipStatus: trimOrNull(item.relationshipStatus),
    }));

const assertUniqueSubmittedMemberNik = (members) => {
  const seen = new Set();
  const duplicate = members.find((member) => {
    if (!member.nik) return false;
    if (seen.has(member.nik)) return true;
    seen.add(member.nik);
    return false;
  });

  if (duplicate) {
    const message = `NIK anggota keluarga tidak boleh sama dalam satu KK (${maskIdentifier(duplicate.nik)}).`;
    throw new ApiError(422, message, {
      fieldErrors: {
        members: [message],
      },
    });
  }
};

const duplicateFamilyNumberError = (family) => {
  const message = `No KK ${maskIdentifier(family.familyNumber)} sudah terdaftar di desa ini atas nama ${family.headName}. Cari di Master KK, jangan input ulang.`;

  return new ApiError(409, message, {
    fieldErrors: {
      familyNumber: [message],
    },
  });
};

const duplicateMemberNikError = (member, submittedMember) => {
  const submittedName = submittedMember?.fullName ? ` untuk ${submittedMember.fullName}` : '';
  const message = `NIK anggota${submittedName} (${maskIdentifier(member.nik)}) sudah dipakai di desa ini oleh ${member.fullName} pada KK ${maskIdentifier(member.family?.familyNumber)}.`;

  return new ApiError(409, message, {
    fieldErrors: {
      members: [message],
    },
  });
};

const assertFamilyNumberAvailable = async ({ familyNumber, villageId, excludeId = null }) => {
  const existing = await prisma.family.findFirst({
    where: {
      familyNumber,
      villageId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      familyNumber: true,
      headName: true,
      villageId: true,
    },
  });

  if (existing) throw duplicateFamilyNumberError(existing);
};

const assertMemberNiksAvailable = async ({ members, villageId, excludeFamilyId = null }) => {
  const niks = members.map((member) => member.nik).filter(Boolean);
  if (!niks.length) return;

  const existing = await prisma.familyMember.findFirst({
    where: {
      nik: { in: niks },
      ...(excludeFamilyId ? { familyId: { not: excludeFamilyId } } : {}),
      family: {
        is: {
          villageId,
        },
      },
    },
    include: {
      family: {
        select: {
          familyNumber: true,
          villageId: true,
        },
      },
    },
  });

  if (!existing) return;
  const submittedMember = members.find((member) => member.nik === existing.nik);
  throw duplicateMemberNikError(existing, submittedMember);
};

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
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target || '');
      if (target.includes('familyNumber')) {
        return new ApiError(409, 'No KK sudah terdaftar di desa ini. Cari data tersebut di Master KK sebelum input ulang.', {
          fieldErrors: { familyNumber: ['No KK sudah terdaftar di desa ini.'] },
        });
      }
      if (target.includes('nik')) {
        return new ApiError(409, 'NIK anggota keluarga sudah terdaftar. Periksa kembali daftar anggota KK.', {
          fieldErrors: { members: ['NIK anggota keluarga sudah terdaftar.'] },
        });
      }
      return new ApiError(409, 'Data unik sudah terdaftar');
    }
    if (error.code === 'P2003') return new ApiError(400, 'Relasi wilayah tidak valid (cek desa/dusun/rw/rt)');
  }
  return error;
};

const resolveFamilyServiceArea = async ({ villageId, hamletId, rwId, rtId }) => {
  const [village, hamlet, rw, rt] = await Promise.all([
    prisma.village.findUnique({ where: { id: villageId }, select: { id: true } }),
    prisma.hamlet.findUnique({ where: { id: hamletId }, select: { id: true, villageId: true } }),
    prisma.rW.findUnique({ where: { id: rwId }, select: { id: true, hamletId: true } }),
    prisma.rT.findUnique({ where: { id: rtId }, select: { id: true, rwId: true } }),
  ]);

  if (!village) throw new ApiError(422, 'Desa layanan tidak ditemukan');
  if (!hamlet) throw new ApiError(422, 'Dusun layanan tidak ditemukan');
  if (!rw) throw new ApiError(422, 'RW layanan tidak ditemukan');
  if (!rt) throw new ApiError(422, 'RT layanan tidak ditemukan');

  if (hamlet.villageId !== village.id) {
    throw new ApiError(422, 'Dusun tidak sesuai dengan desa layanan yang dipilih');
  }
  if (rw.hamletId !== hamlet.id) {
    throw new ApiError(422, 'RW tidak sesuai dengan dusun layanan yang dipilih');
  }
  if (rt.rwId !== rw.id) {
    throw new ApiError(422, 'RT tidak sesuai dengan RW layanan yang dipilih');
  }

  return {
    villageId: village.id,
    hamletId: hamlet.id,
    rwId: rw.id,
    rtId: rt.id,
  };
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
    const payload = normalizeFamilyPayload(req.validated.body);
    const targetVillageId = actorVillageId ?? payload.villageId;
    ensureVillageAccess(req.user, targetVillageId, 'Anda hanya dapat menambah Master KK pada desa Anda');
    const serviceArea = await resolveFamilyServiceArea({
      villageId: targetVillageId,
      hamletId: payload.hamletId,
      rwId: payload.rwId,
      rtId: payload.rtId,
    });
    const members = normalizeFamilyMembers(payload.members);
    assertUniqueSubmittedMemberNik(members);
    await assertFamilyNumberAvailable({ familyNumber: payload.familyNumber, villageId: serviceArea.villageId });
    await assertMemberNiksAvailable({ members, villageId: serviceArea.villageId });
    const created = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          villageId: serviceArea.villageId,
          hamletId: serviceArea.hamletId,
          rwId: serviceArea.rwId,
          rtId: serviceArea.rtId,
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
    const payload = normalizeFamilyPayload(req.validated.body);
    const members = normalizeFamilyMembers(payload.members);
    const exists = await prisma.family.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, 'Master KK tidak ditemukan');
    ensureVillageAccess(req.user, exists.villageId, 'Anda hanya dapat mengubah Master KK pada desa Anda');
    const targetVillageId = actorVillageId ?? payload.villageId;
    ensureVillageAccess(req.user, targetVillageId, 'Anda hanya dapat mengubah Master KK pada desa Anda');
    const serviceArea = await resolveFamilyServiceArea({
      villageId: targetVillageId,
      hamletId: payload.hamletId,
      rwId: payload.rwId,
      rtId: payload.rtId,
    });
    assertUniqueSubmittedMemberNik(members);
    await assertFamilyNumberAvailable({ familyNumber: payload.familyNumber, villageId: serviceArea.villageId, excludeId: id });
    await assertMemberNiksAvailable({ members, villageId: serviceArea.villageId, excludeFamilyId: id });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.family.update({
        where: { id },
        data: {
          villageId: serviceArea.villageId,
          hamletId: serviceArea.hamletId,
          rwId: serviceArea.rwId,
          rtId: serviceArea.rtId,
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
