import { getKmsReferenceByAge, normalizeGender } from '../../config/kms-reference.js';

export const toddlerListInclude = {
  hamlet: true,
  rw: true,
  rt: true,
  posyandu: true,
  family: true,
  cards: {
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  checkups: {
    orderBy: { examDate: 'desc' },
    take: 1,
  },
};

export const toddlerDetailInclude = {
  ...toddlerListInclude,
  checkups: {
    orderBy: { examDate: 'desc' },
    include: {
      interventions: {
        include: {
          interventionType: true,
        },
      },
      immunizations: {
        include: {
          immunization: true,
        },
      },
    },
  },
};

const buildCheckupIdealReference = (ageInMonths, gender) => {
  const parsedAge = Number(ageInMonths);
  if (!Number.isFinite(parsedAge)) return null;
  const normalizedGender = normalizeGender(gender);
  const reference = getKmsReferenceByAge({ ageInMonths: parsedAge, gender: normalizedGender });
  return {
    genderReference: normalizedGender,
    idealWeight: Number(reference.weightMedian),
    idealWeightMin: Number(reference.weightMinus2Sd),
    idealWeightMax: Number(reference.weightPlus1Sd),
    idealHeight: Number(reference.heightMedian),
    idealHeightMin: Number(reference.heightMinus2Sd),
    idealHeightMax: Number(reference.heightPlus1Sd),
  };
};

const normalizeLegacyRiskLevel = (riskLevel) => (riskLevel === 'ATTENTION' ? 'NORMAL' : riskLevel);

const normalizeLegacyStatusLabel = (statusLabel, riskLevel) => {
  if (!statusLabel) return statusLabel;
  if (riskLevel !== 'ATTENTION') return statusLabel;
  return String(statusLabel).replace(/perlu perhatian/gi, 'normal dengan indikator risiko awal KIA');
};

export const mapCheckup = (checkup, toddlerGender = null) => {
  const idealReference = toddlerGender ? buildCheckupIdealReference(checkup.ageInMonths, toddlerGender) : null;
  const normalizedRiskLevel = normalizeLegacyRiskLevel(checkup.riskLevel);
  const normalizedStatusLabel = normalizeLegacyStatusLabel(checkup.statusLabel, checkup.riskLevel);
  return {
    ...checkup,
    riskLevel: normalizedRiskLevel,
    statusLabel: normalizedStatusLabel,
    weight: Number(checkup.weight),
    height: Number(checkup.height),
    headCircumference: checkup.headCircumference !== null ? Number(checkup.headCircumference) : null,
    muac: checkup.muac !== null ? Number(checkup.muac) : null,
    genderReference: idealReference?.genderReference || null,
    idealWeight: idealReference?.idealWeight ?? null,
    idealWeightMin: idealReference?.idealWeightMin ?? null,
    idealWeightMax: idealReference?.idealWeightMax ?? null,
    idealHeight: idealReference?.idealHeight ?? null,
    idealHeightMin: idealReference?.idealHeightMin ?? null,
    idealHeightMax: idealReference?.idealHeightMax ?? null,
  };
};

export const mapToddler = (toddler) => ({
  id: toddler.id,
  kode_balita: toddler.code,
  nama_lengkap: toddler.fullName,
  nik: toddler.nik,
  no_kk: toddler.noKk,
  tempat_lahir: toddler.placeOfBirth,
  tanggal_lahir: toddler.birthDate,
  jenis_kelamin: toddler.gender,
  nama_ibu: toddler.motherName,
  nama_ayah: toddler.fatherName,
  id_keluarga: toddler.familyId,
  id_posyandu: toddler.posyanduId,
  alamat: toddler.address,
  dusun_id: toddler.hamletId,
  rw_id: toddler.rwId,
  rt_id: toddler.rtId,
  no_hp_orangtua: toddler.parentPhone,
  status_aktif: toddler.status === 'ACTIVE',
  qr_code_value: toddler.qrCodeValue,
  photo_url: toddler.photoUrl,
  created_at: toddler.createdAt,
  updated_at: toddler.updatedAt,
  family: toddler.family,
  hamlet: toddler.hamlet,
  rw: toddler.rw,
  rt: toddler.rt,
  posyandu: toddler.posyandu,
  card: toddler.cards?.[0] || null,
  latestCheckup: toddler.checkups?.[0] ? mapCheckup(toddler.checkups[0], toddler.gender) : null,
  checkups: toddler.checkups?.map((checkup) => mapCheckup(checkup, toddler.gender)) || [],
});
