import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';
import { ApiError } from '../../utils/api-error.js';
import { buildMeta, buildPagination } from '../../utils/pagination.js';
import { mapToddler, toddlerDetailInclude, toddlerListInclude } from './balita.shared.js';

const createToddlerCardData = (qrCodeValue) => {
  const publicToken = nanoid(16);
  return {
    cardNumber: `KMS-${nanoid(10).toUpperCase()}`,
    publicToken,
    qrCodeUrl: `/public/cards/${publicToken}`,
  };
};

const normalizeRelation = (value) => String(value || '').trim().toUpperCase();

const CHILD_RELATIONS = new Set(['ANAK', 'CUCU', 'FAMILI LAIN', 'LAINNYA']);

const isChildRelation = (relationType) => CHILD_RELATIONS.has(normalizeRelation(relationType));

const findMemberByPriority = (members, priorities, gender) => {
  for (const relation of priorities) {
    const match = members.find(
      (item) =>
        normalizeRelation(item.relationType) === relation &&
        (!gender || item.gender === gender),
    );
    if (match) return match;
  }
  return null;
};

const sanitizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const cleaned = String(value).trim();
  return cleaned ? cleaned : null;
};

const pickDefined = (value, fallback) => (value === undefined ? fallback : value);

const calculateAgeInMonths = (birthDateValue) => {
  const birthDate = new Date(birthDateValue);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (now.getDate() < birthDate.getDate()) months -= 1;
  return months;
};

const isToddlerAgeByBirthDate = (birthDateValue) => {
  const ageInMonths = calculateAgeInMonths(birthDateValue);
  return ageInMonths !== null && ageInMonths >= 0 && ageInMonths <= 59;
};

const assertToddlerAgeInRange = (birthDateValue) => {
  const ageInMonths = calculateAgeInMonths(birthDateValue);
  if (ageInMonths === null || ageInMonths < 0) {
    throw new ApiError(400, 'Tanggal lahir balita tidak valid');
  }
  if (ageInMonths > 59) {
    throw new ApiError(400, 'Usia di atas 59 bulan bukan kategori balita');
  }
};

const mapPrismaError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      if (String(error.meta?.target || '').includes('nik')) {
        return new ApiError(409, 'NIK balita/anggota keluarga sudah terdaftar');
      }
      return new ApiError(409, 'Data unik sudah terdaftar');
    }
    if (error.code === 'P2003') {
      return new ApiError(400, 'Relasi data tidak valid (cek keluarga/posyandu/wilayah)');
    }
  }
  return error;
};

const resolveFamilyContext = async (tx, payload) => {
  const family = await tx.family.findUnique({
    where: { id: Number(payload.familyId) },
    include: {
      members: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!family) throw new ApiError(400, 'Master KK tidak ditemukan');

  const fatherMember =
    findMemberByPriority(family.members, ['AYAH', 'SUAMI', 'KEPALA KELUARGA'], 'MALE') ||
    null;
  const motherMember =
    findMemberByPriority(family.members, ['IBU', 'ISTRI', 'KEPALA KELUARGA'], 'FEMALE') ||
    null;

  return { family, fatherMember, motherMember };
};

const resolveSelectedChildMember = ({ family, familyMemberId, allowOptional }) => {
  const childCandidates = family.members.filter((item) => isChildRelation(item.relationType));

  if (!familyMemberId) {
    if (!allowOptional) {
      throw new ApiError(
        400,
        'Pilih anak dari Master KK terlebih dahulu (lengkapi anggota keluarga di Master KK).',
      );
    }
    return null;
  }

  const selected = childCandidates.find((item) => item.id === Number(familyMemberId));
  if (!selected) {
    throw new ApiError(400, 'Anak yang dipilih tidak ditemukan pada Master KK ini');
  }
  if (!isToddlerAgeByBirthDate(selected.birthDate)) {
    throw new ApiError(400, 'Anak yang dipilih bukan kategori balita (usia 0-59 bulan)');
  }
  return selected;
};

const syncChildMemberFromToddler = async (tx, { selectedChildMember, toddlerData }) => {
  if (!selectedChildMember) return null;

  await tx.familyMember.update({
    where: { id: selectedChildMember.id },
    data: {
      fullName: toddlerData.fullName,
      nik: toddlerData.nik,
      gender: toddlerData.gender,
      placeOfBirth: toddlerData.placeOfBirth,
      birthDate: toddlerData.birthDate,
      fatherName: toddlerData.fatherName,
      motherName: toddlerData.motherName,
      relationType: normalizeRelation(selectedChildMember.relationType || 'ANAK'),
    },
  });
  return selectedChildMember.id;
};

const buildToddlerData = ({ payload, existing, family, fatherMember, motherMember, selectedChildMember }) => {
  const base = {
    code: sanitizeText(pickDefined(payload.code, existing?.code)),
    fullName: sanitizeText(pickDefined(payload.fullName, existing?.fullName)) || selectedChildMember?.fullName,
    nik: sanitizeText(pickDefined(payload.nik, existing?.nik)) ?? selectedChildMember?.nik ?? null,
    noKk: family.familyNumber,
    placeOfBirth:
      sanitizeText(pickDefined(payload.placeOfBirth, existing?.placeOfBirth)) ||
      selectedChildMember?.placeOfBirth ||
      'Kabupaten Mojokerto',
    birthDate: pickDefined(payload.birthDate, existing?.birthDate) || selectedChildMember?.birthDate,
    gender: pickDefined(payload.gender, existing?.gender) || selectedChildMember?.gender,
    motherName:
      motherMember?.fullName ||
      sanitizeText(pickDefined(payload.motherName, existing?.motherName)) ||
      'Belum diisi',
    fatherName:
      fatherMember?.fullName ||
      sanitizeText(pickDefined(payload.fatherName, existing?.fatherName)) ||
      family.headName ||
      'Belum diisi',
    familyId: family.id,
    posyanduId: Number(pickDefined(payload.posyanduId, existing?.posyanduId)),
    address: sanitizeText(pickDefined(payload.address, existing?.address)) || family.address,
    hamletId: Number(family.hamletId),
    rwId: Number(family.rwId),
    rtId: Number(family.rtId),
    parentPhone: sanitizeText(pickDefined(payload.parentPhone, existing?.parentPhone)) || family.phone || null,
    status: pickDefined(payload.status, existing?.status),
    photoUrl: sanitizeText(pickDefined(payload.photoUrl, existing?.photoUrl)),
  };

  if (!base.fullName) throw new ApiError(400, 'Nama balita wajib diisi');
  if (!base.birthDate) throw new ApiError(400, 'Tanggal lahir balita wajib diisi');
  if (!base.gender) throw new ApiError(400, 'Jenis kelamin balita wajib diisi');
  if (!base.posyanduId) throw new ApiError(400, 'Posyandu wajib dipilih');

  return base;
};

export const listToddlers = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = buildPagination(req.query);
    const search = req.query.search?.trim();
    const riskFilter = req.query.riskLevel?.trim();
    const where = {
      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { code: { contains: search } },
              { motherName: { contains: search } },
              { fatherName: { contains: search } },
            ],
          }
        : {}),
      ...(req.query.posyanduId ? { posyanduId: Number(req.query.posyanduId) } : {}),
      ...(req.query.hamletId ? { hamletId: Number(req.query.hamletId) } : {}),
      ...(req.query.status ? { status: req.query.status } : {}),
    };

    const items = await prisma.toddler.findMany({
      where,
      include: toddlerListInclude,
      orderBy: { createdAt: 'desc' },
    });
    const onlyToddlers = items
      .map(mapToddler)
      .filter((item) => isToddlerAgeByBirthDate(item.tanggal_lahir));
    const filtered = riskFilter
      ? onlyToddlers.filter((item) => item.latestCheckup?.riskLevel === riskFilter)
      : onlyToddlers;
    const paged = filtered.slice(skip, skip + take);

    res.json({
      success: true,
      data: paged,
      meta: buildMeta({ page, pageSize, total: filtered.length }),
    });
  } catch (error) {
    next(error);
  }
};

export const getToddlerById = async (req, res, next) => {
  try {
    const toddler = await prisma.toddler.findUnique({
      where: { id: Number(req.params.id) },
      include: toddlerDetailInclude,
    });

    if (!toddler || !isToddlerAgeByBirthDate(toddler.birthDate)) {
      throw new ApiError(404, 'Balita tidak ditemukan');
    }
    res.json({ success: true, data: mapToddler(toddler) });
  } catch (error) {
    next(error);
  }
};

export const createToddler = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const qrCodeValue = `TDR-${nanoid(12).toUpperCase()}`;
    const cardData = createToddlerCardData(qrCodeValue);
    const toddler = await prisma.$transaction(async (tx) => {
      const { family, fatherMember, motherMember } = await resolveFamilyContext(tx, payload);
      const selectedChildMember = resolveSelectedChildMember({
        family,
        familyMemberId: payload.familyMemberId,
        allowOptional: false,
      });

      const toddlerData = buildToddlerData({
        payload,
        existing: null,
        family,
        fatherMember,
        motherMember,
        selectedChildMember,
      });
      assertToddlerAgeInRange(toddlerData.birthDate);

      toddlerData.code = toddlerData.code || `BLT-${nanoid(8).toUpperCase()}`;

      await syncChildMemberFromToddler(tx, {
        selectedChildMember,
        toddlerData,
      });

      return tx.toddler.create({
        data: {
          ...toddlerData,
          qrCodeValue,
          cards: {
            create: cardData,
          },
        },
        include: toddlerDetailInclude,
      });
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE_TODDLER',
      entityType: 'Toddler',
      entityId: toddler.id,
      description: `Menambah balita ${toddler.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: mapToddler(toddler) });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const updateToddler = async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const payload = req.validated.body;
    const toddler = await prisma.toddler.findUnique({
      where: { id },
    });
    if (!toddler) throw new ApiError(404, 'Balita tidak ditemukan');

    const updateInput = {
      code: toddler.code,
      fullName: toddler.fullName,
      nik: toddler.nik,
      noKk: toddler.noKk,
      placeOfBirth: toddler.placeOfBirth,
      birthDate: toddler.birthDate,
      gender: toddler.gender,
      motherName: toddler.motherName,
      fatherName: toddler.fatherName,
      familyId: toddler.familyId,
      posyanduId: toddler.posyanduId,
      address: toddler.address,
      hamletId: toddler.hamletId,
      rwId: toddler.rwId,
      rtId: toddler.rtId,
      parentPhone: toddler.parentPhone,
      status: toddler.status,
      photoUrl: toddler.photoUrl,
      ...payload,
    };

    const updated = await prisma.$transaction(async (tx) => {
      const { family, fatherMember, motherMember } = await resolveFamilyContext(tx, updateInput);
      const selectedChildMember = resolveSelectedChildMember({
        family,
        familyMemberId: payload.familyMemberId || null,
        allowOptional: true,
      });

      const toddlerData = buildToddlerData({
        payload: updateInput,
        existing: toddler,
        family,
        fatherMember,
        motherMember,
        selectedChildMember,
      });
      assertToddlerAgeInRange(toddlerData.birthDate);

      await syncChildMemberFromToddler(tx, {
        selectedChildMember,
        toddlerData,
      });

      return tx.toddler.update({
        where: { id },
        data: toddlerData,
        include: toddlerDetailInclude,
      });
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE_TODDLER',
      entityType: 'Toddler',
      entityId: updated.id,
      description: `Memperbarui balita ${updated.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: mapToddler(updated) });
  } catch (error) {
    next(mapPrismaError(error));
  }
};

export const deleteToddler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const toddler = await prisma.toddler.findUnique({ where: { id } });
    if (!toddler) throw new ApiError(404, 'Balita tidak ditemukan');
    await prisma.toddler.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE_TODDLER',
      entityType: 'Toddler',
      entityId: id,
      description: `Menghapus balita ${toddler.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: { message: 'Balita dihapus' } });
  } catch (error) {
    next(error);
  }
};
