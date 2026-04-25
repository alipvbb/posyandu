import 'dotenv/config';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLES, ROLE_PERMISSION_MAP, SYSTEM_PERMISSIONS } from '../src/config/constants.js';
import { env } from '../src/config/env.js';
import {
  calculateAgeInMonths,
  evaluateGrowthStatus,
  expectedHeadCircumferenceByAge,
  expectedHeightByAge,
  expectedMuacByAge,
  expectedWeightByAge,
} from '../src/services/growth.service.js';

const prisma = new PrismaClient();

faker.seed(20260421);

const maleNames = ['Ahmad', 'Budi', 'Dimas', 'Rizky', 'Rafi', 'Fajar', 'Andi', 'Yoga', 'Ilham', 'Bagas', 'Arif', 'Hanif'];
const femaleNames = ['Siti', 'Ayu', 'Rina', 'Nadia', 'Putri', 'Lestari', 'Wulan', 'Dewi', 'Nabila', 'Citra', 'Fina', 'Maya'];
const lastNames = ['Saputra', 'Pratama', 'Lestari', 'Wibowo', 'Rahmawati', 'Hidayat', 'Sari', 'Wijaya', 'Maulana', 'Permata'];
const hamletNames = ['Dusun Melati', 'Dusun Kenanga', 'Dusun Cempaka', 'Dusun Anggrek'];

const randomName = (gender) => {
  const first = gender === 'MALE' ? faker.helpers.arrayElement(maleNames) : faker.helpers.arrayElement(femaleNames);
  return `${first} ${faker.helpers.arrayElement(lastNames)}`;
};

const randomPhone = () => `08${faker.string.numeric(10)}`;
const randomNik = () => faker.string.numeric(16);
const randomFamilyNumber = () => faker.string.numeric(16);
const randomBool = (chance) => faker.number.float({ min: 0, max: 1 }) < chance;
const SEED_ABSENT_THIS_MONTH_COUNT = 10;

const riskProfiles = [
  ...Array.from({ length: 50 }, () => 'NORMAL'),
  ...Array.from({ length: 20 }, () => 'ATTENTION'),
  ...Array.from({ length: 15 }, () => 'STUNTING_RISK'),
  ...Array.from({ length: 10 }, () => 'UNDERNUTRITION'),
  ...Array.from({ length: 15 }, () => 'OVERWEIGHT'),
];

const defaultUsers = [
  { name: 'Admin Posyandu', email: 'admin@posyandu.local', roleCode: 'admin' },
  { name: 'Kepala Desa', email: 'kades@posyandu.local', roleCode: 'kepala-desa' },
  { name: 'Petugas Kesehatan', email: 'petugas@posyandu.local', roleCode: 'petugas-kesehatan' },
  { name: 'Kader Posyandu', email: 'kader@posyandu.local', roleCode: 'kader-posyandu' },
  { name: 'Operator Desa', email: 'operator@posyandu.local', roleCode: 'operator-desa' },
  { name: 'Viewer Posyandu', email: 'viewer@posyandu.local', roleCode: 'viewer' },
];

const interventionsSeed = [
  ['vitamin-a', 'Vitamin A'],
  ['pmt', 'Pemberian Makanan Tambahan'],
  ['konseling-gizi', 'Konseling Gizi'],
  ['rujukan-puskesmas', 'Rujukan Puskesmas'],
  ['kunjungan-rumah', 'Kunjungan Rumah'],
];

const immunizationsSeed = [
  ['hb0', 'HB0', 0],
  ['bcg', 'BCG', 1],
  ['polio', 'Polio', 2],
  ['dpt-hb-hib', 'DPT-HB-Hib', 3],
  ['campak', 'Campak', 9],
  ['mr', 'MR', 18],
];

const pickRiskProfile = (index) => riskProfiles[index % riskProfiles.length];

const getProfileOffsets = (profile) => {
  if (profile === 'NORMAL') {
    return {
      weight: faker.number.float({ min: -0.1, max: 0.7, fractionDigits: 2 }),
      height: faker.number.float({ min: -0.5, max: 1.8, fractionDigits: 2 }),
      trendDrift: faker.number.float({ min: 0.08, max: 0.25, fractionDigits: 2 }),
    };
  }
  if (profile === 'ATTENTION') {
    return {
      weight: faker.number.float({ min: -0.7, max: 0.1, fractionDigits: 2 }),
      height: faker.number.float({ min: -3.5, max: -1.2, fractionDigits: 2 }),
      trendDrift: faker.number.float({ min: -0.03, max: 0.12, fractionDigits: 2 }),
    };
  }
  if (profile === 'STUNTING_RISK') {
    return {
      weight: faker.number.float({ min: -1.2, max: -0.4, fractionDigits: 2 }),
      height: faker.number.float({ min: -8.5, max: -5.6, fractionDigits: 2 }),
      trendDrift: faker.number.float({ min: -0.07, max: 0.07, fractionDigits: 2 }),
    };
  }
  if (profile === 'OVERWEIGHT') {
    return {
      weight: faker.number.float({ min: 2.0, max: 3.8, fractionDigits: 2 }),
      height: faker.number.float({ min: -0.4, max: 1.6, fractionDigits: 2 }),
      trendDrift: faker.number.float({ min: 0.02, max: 0.2, fractionDigits: 2 }),
    };
  }
  return {
    weight: faker.number.float({ min: -2.1, max: -1.1, fractionDigits: 2 }),
    height: faker.number.float({ min: -4.4, max: -2.2, fractionDigits: 2 }),
    trendDrift: faker.number.float({ min: -0.1, max: 0.06, fractionDigits: 2 }),
  };
};

const buildCheckupMeasures = ({ ageInMonths, gender, profile, index, total }) => {
  const baseWeight = expectedWeightByAge(ageInMonths, gender);
  const baseHeight = expectedHeightByAge(ageInMonths, gender);
  const baseHeadCircumference = expectedHeadCircumferenceByAge(ageInMonths, gender);
  const baseMuac = expectedMuacByAge(ageInMonths, gender);
  const offsets = getProfileOffsets(profile);
  const progression = index / Math.max(total - 1, 1);
  const weight =
    baseWeight +
    offsets.weight +
    progression * offsets.trendDrift +
    faker.number.float({ min: -0.15, max: 0.18, fractionDigits: 2 });
  const height =
    baseHeight +
    offsets.height +
    progression * 0.15 +
    faker.number.float({ min: -0.4, max: 0.6, fractionDigits: 2 });
  const headCircumference =
    baseHeadCircumference +
    (profile === 'STUNTING_RISK' ? faker.number.float({ min: -1.4, max: -0.4, fractionDigits: 2 }) : 0) +
    faker.number.float({ min: -0.45, max: 0.45, fractionDigits: 2 });
  const muac =
    baseMuac +
    (profile === 'UNDERNUTRITION' || profile === 'STUNTING_RISK'
      ? faker.number.float({ min: -1.3, max: -0.3, fractionDigits: 2 })
      : profile === 'OVERWEIGHT'
        ? faker.number.float({ min: 0.2, max: 1.0, fractionDigits: 2 })
        : faker.number.float({ min: -0.35, max: 0.45, fractionDigits: 2 }));

  return {
    weight: Number(Math.max(weight, 2.6).toFixed(2)),
    height: Number(Math.max(height, 45).toFixed(2)),
    headCircumference: Number(Math.max(headCircumference, 30).toFixed(2)),
    muac: Number(Math.max(muac, 9.5).toFixed(2)),
  };
};

const toCode = (prefix, index) => `${prefix}-${String(index).padStart(4, '0')}`;

async function main() {
  console.log(`Seeding with DATABASE_URL=${env.databaseUrl}`);

  await prisma.$transaction([
    prisma.rolePermission.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.growthStatusLog.deleteMany(),
    prisma.checkupIntervention.deleteMany(),
    prisma.toddlerImmunization.deleteMany(),
    prisma.checkup.deleteMany(),
    prisma.toddlerCard.deleteMany(),
    prisma.toddler.deleteMany(),
    prisma.mother.deleteMany(),
    prisma.father.deleteMany(),
    prisma.family.deleteMany(),
    prisma.posyandu.deleteMany(),
    prisma.rT.deleteMany(),
    prisma.rW.deleteMany(),
    prisma.hamlet.deleteMany(),
    prisma.village.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.immunization.deleteMany(),
    prisma.interventionType.deleteMany(),
  ]);

  const permissions = [];
  for (const permission of SYSTEM_PERMISSIONS) {
    permissions.push(
      await prisma.permission.create({
        data: {
          name: permission.name,
          code: permission.code,
          description: permission.name,
        },
      }),
    );
  }

  const roleMap = {};
  for (const roleSeed of DEFAULT_ROLES) {
    const role = await prisma.role.create({
      data: {
        name: roleSeed.name,
        code: roleSeed.code,
        description: `Role ${roleSeed.name}`,
      },
    });

    roleMap[role.code] = role;

    for (const permissionCode of ROLE_PERMISSION_MAP[role.code]) {
      const permission = permissions.find((item) => item.code === permissionCode);
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  for (const item of defaultUsers) {
    const user = await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roleMap[item.roleCode].id,
      },
    });
  }

  const village = await prisma.village.create({
    data: {
      name: 'Desa Suka Sehat',
      code: 'DS-SUKA-SEHAT',
    },
  });

  const hamlets = [];
  const rws = [];
  const rts = [];
  const posyandus = [];

  for (let i = 0; i < hamletNames.length; i += 1) {
    const hamlet = await prisma.hamlet.create({
      data: {
        villageId: village.id,
        name: hamletNames[i],
        code: `HML-${i + 1}`,
      },
    });
    hamlets.push(hamlet);

    const posyandu = await prisma.posyandu.create({
      data: {
        villageId: village.id,
        hamletId: hamlet.id,
        name: `Posyandu ${hamletNames[i].replace('Dusun ', '')}`,
        code: `POS-${i + 1}`,
        locationAddress: `${hamletNames[i]}, Desa Suka Sehat`,
        scheduleDay: faker.helpers.arrayElement(['Senin', 'Selasa', 'Rabu', 'Kamis']),
        contactPhone: randomPhone(),
      },
    });
    posyandus.push(posyandu);

    for (let rwNumber = 1; rwNumber <= 2; rwNumber += 1) {
      const rw = await prisma.rW.create({
        data: {
          hamletId: hamlet.id,
          name: `RW ${rwNumber.toString().padStart(2, '0')}`,
          code: `RW-${i + 1}-${rwNumber}`,
        },
      });
      rws.push(rw);

      for (let rtNumber = 1; rtNumber <= 2; rtNumber += 1) {
        const rt = await prisma.rT.create({
          data: {
            rwId: rw.id,
            name: `RT ${rtNumber.toString().padStart(2, '0')}`,
            code: `RT-${i + 1}-${rwNumber}-${rtNumber}`,
          },
        });
        rts.push(rt);
      }
    }
  }

  for (const [code, name] of interventionsSeed) {
    await prisma.interventionType.create({
      data: {
        code,
        name,
      },
    });
  }

  const immunizationRecords = [];
  for (const [code, name, recommendedAtMonth] of immunizationsSeed) {
    immunizationRecords.push(
      await prisma.immunization.create({
        data: {
          code,
          name,
          recommendedAtMonth,
        },
      }),
    );
  }

  const interventionRecords = await prisma.interventionType.findMany();
  const officers = await prisma.user.findMany({
    where: {
      email: {
        in: ['petugas@posyandu.local', 'kader@posyandu.local', 'admin@posyandu.local'],
      },
    },
  });

  const families = [];
  for (let i = 0; i < 85; i += 1) {
    const hamlet = faker.helpers.arrayElement(hamlets);
    const hamletRws = rws.filter((item) => item.hamletId === hamlet.id);
    const rw = faker.helpers.arrayElement(hamletRws);
    const rt = faker.helpers.arrayElement(rts.filter((item) => item.rwId === rw.id));
    const fatherName = randomName('MALE');
    const motherName = randomName('FEMALE');

    const family = await prisma.family.create({
      data: {
        villageId: village.id,
        hamletId: hamlet.id,
        rwId: rw.id,
        rtId: rt.id,
        familyNumber: randomFamilyNumber(),
        headName: fatherName,
        address: `Jl. ${faker.helpers.arrayElement(['Melati', 'Anggrek', 'Kenanga', 'Cempaka'])} No. ${faker.number.int({ min: 1, max: 120 })}`,
        phone: randomPhone(),
        members: {
          create: [
            {
              relationType: 'KEPALA KELUARGA',
              fullName: fatherName,
              nik: randomNik(),
              gender: 'MALE',
              placeOfBirth: 'Kabupaten Sehat',
              birthDate: dayjs().subtract(faker.number.int({ min: 25, max: 55 }), 'year').toDate(),
              religion: faker.helpers.arrayElement(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA']),
              education: faker.helpers.arrayElement(['SMA', 'SMP', 'SD', 'Diploma', 'Sarjana']),
              occupation: faker.helpers.arrayElement(['Petani', 'Pedagang', 'Karyawan', 'Buruh']),
              maritalStatus: 'KAWIN',
              citizenship: 'WNI',
            },
            {
              relationType: 'ISTRI',
              fullName: motherName,
              nik: randomNik(),
              gender: 'FEMALE',
              placeOfBirth: 'Kabupaten Sehat',
              birthDate: dayjs().subtract(faker.number.int({ min: 22, max: 50 }), 'year').toDate(),
              religion: faker.helpers.arrayElement(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA']),
              education: faker.helpers.arrayElement(['SMA', 'SMP', 'SD', 'Diploma', 'Sarjana']),
              occupation: faker.helpers.arrayElement(['Ibu Rumah Tangga', 'Pedagang', 'Petani', 'Guru']),
              maritalStatus: 'KAWIN',
              citizenship: 'WNI',
            },
          ],
        },
        mothers: {
          create: {
            fullName: motherName,
            nik: randomNik(),
            phone: randomPhone(),
            occupation: faker.helpers.arrayElement(['Ibu Rumah Tangga', 'Pedagang', 'Petani', 'Guru']),
          },
        },
        fathers: {
          create: {
            fullName: fatherName,
            nik: randomNik(),
            phone: randomPhone(),
            occupation: faker.helpers.arrayElement(['Petani', 'Pedagang', 'Karyawan', 'Buruh']),
          },
        },
      },
      include: {
        mothers: true,
        fathers: true,
      },
    });
    families.push(family);
  }

  let toddlerCounter = 0;
  const familyCapacity = new Map(families.map((item) => [item.id, 0]));
  let seededAbsentThisMonthCount = 0;

  while (toddlerCounter < 110) {
    const family = faker.helpers.arrayElement(
      families.filter((item) => familyCapacity.get(item.id) < 2 || families.length - toddlerCounter > 10),
    );
    familyCapacity.set(family.id, (familyCapacity.get(family.id) || 0) + 1);

    const hamlet = hamlets.find((item) => item.id === family.hamletId);
    const rw = rws.find((item) => item.id === family.rwId);
    const rt = rts.find((item) => item.id === family.rtId);
    const posyandu = faker.helpers.arrayElement(posyandus.filter((item) => item.hamletId === family.hamletId));
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE']);
    const profile = pickRiskProfile(toddlerCounter);
    const shouldSeedAbsentThisMonth = toddlerCounter < SEED_ABSENT_THIS_MONTH_COUNT;
    const ageInMonths = shouldSeedAbsentThisMonth ? faker.number.int({ min: 2, max: 59 }) : faker.number.int({ min: 0, max: 59 });
    const birthDate = dayjs().subtract(ageInMonths, 'month').subtract(faker.number.int({ min: 0, max: 27 }), 'day').toDate();
    const fullName = randomName(gender);
    const qrCodeValue = `TDR-${faker.string.alphanumeric(12).toUpperCase()}`;
    const publicToken = faker.string.alphanumeric(16);
    const toddlerStatus = shouldSeedAbsentThisMonth ? 'ACTIVE' : randomBool(0.92) ? 'ACTIVE' : 'INACTIVE';

    const toddler = await prisma.toddler.create({
      data: {
        code: toCode('BLT', toddlerCounter + 1),
        fullName,
        nik: randomBool(0.55) ? randomNik() : null,
        noKk: family.familyNumber,
        placeOfBirth: 'Kabupaten Sehat',
        birthDate,
        gender,
        motherName: family.mothers[0].fullName,
        fatherName: family.fathers[0].fullName,
        familyId: family.id,
        posyanduId: posyandu.id,
        address: family.address,
        hamletId: hamlet.id,
        rwId: rw.id,
        rtId: rt.id,
        parentPhone: family.phone,
        status: toddlerStatus,
        qrCodeValue,
        cards: {
          create: {
            cardNumber: `KMS-${String(toddlerCounter + 1).padStart(5, '0')}`,
            publicToken,
            qrCodeUrl: `${env.appPublicBaseUrl}/public/cards/${publicToken}`,
          },
        },
      },
    });

    const historyCount = faker.number.int({ min: 2, max: Math.min(Math.max(ageInMonths + 1, 2), 10) });
    const examDates = Array.from({ length: historyCount }).map((_, index) => {
      const monthsBack = Math.max(historyCount - index - 1, 0) + (shouldSeedAbsentThisMonth ? 1 : 0);
      return dayjs().subtract(monthsBack, 'month').subtract(faker.number.int({ min: 0, max: 4 }), 'day');
    });

    let previousCheckup = null;

    for (let index = 0; index < examDates.length; index += 1) {
      const examDate = examDates[index].toDate();
      const ageAtExam = calculateAgeInMonths(birthDate, examDate);
      const measures = buildCheckupMeasures({ ageInMonths: ageAtExam, gender, profile, index, total: examDates.length });
      const evaluation = evaluateGrowthStatus({
        toddler: { birthDate, gender },
        currentCheckup: {
          examDate,
          ageInMonths: ageAtExam,
          weight: measures.weight,
          height: measures.height,
        },
        previousCheckup,
      });

      const interventionTypeIds =
        profile !== 'NORMAL' && randomBool(0.65)
          ? faker.helpers.arrayElements(
              interventionRecords.map((item) => item.id),
              faker.number.int({ min: 1, max: 2 }),
            )
          : [];
      const immunizationIds = immunizationRecords
        .filter((item) => item.recommendedAtMonth === null || item.recommendedAtMonth <= ageAtExam)
        .filter(() => randomBool(0.2))
        .slice(0, 2)
        .map((item) => item.id);

      const checkup = await prisma.checkup.create({
        data: {
          toddlerId: toddler.id,
          posyanduId: posyandu.id,
          createdById: faker.helpers.arrayElement(officers).id,
          examDate,
          ageInMonths: ageAtExam,
          weight: measures.weight,
          height: measures.height,
          headCircumference: measures.headCircumference,
          muac: measures.muac,
          immunizationNote: immunizationIds.length ? 'Imunisasi diberikan sesuai jadwal.' : null,
          vitaminPmtNote: interventionTypeIds.length ? 'Diberikan intervensi dan edukasi singkat.' : null,
          complaintNote: randomBool(0.15) ? faker.helpers.arrayElement(['Nafsu makan turun', 'Batuk ringan', 'Demam pekan lalu']) : null,
          officerName: faker.helpers.arrayElement(['Bidan Desa', 'Kader Posyandu', 'Perawat Puskesmas']),
          growthTrend: evaluation.trend,
          riskLevel: evaluation.riskLevel,
          statusLabel: evaluation.statusLabel,
          growthSummary: evaluation.summary,
          interventions: interventionTypeIds.length
            ? {
                create: interventionTypeIds.map((interventionTypeId) => ({ interventionTypeId })),
              }
            : undefined,
          immunizations: immunizationIds.length
            ? {
                create: immunizationIds.map((immunizationId) => ({
                  toddlerId: toddler.id,
                  immunizationId,
                  administeredAt: examDate,
                })),
              }
            : undefined,
        },
      });

      await prisma.growthStatusLog.create({
        data: {
          toddlerId: toddler.id,
          checkupId: checkup.id,
          previousCheckupId: previousCheckup?.id,
          ageInMonths: evaluation.ageInMonths,
          trend: evaluation.trend,
          riskLevel: evaluation.riskLevel,
          weightDelta: evaluation.weightDelta,
          weightGap: evaluation.weightGap,
          heightGap: evaluation.heightGap,
          note: evaluation.summary,
        },
      });

      previousCheckup = {
        id: checkup.id,
        weight: measures.weight,
      };
    }

    if (shouldSeedAbsentThisMonth && toddlerStatus === 'ACTIVE') {
      seededAbsentThisMonthCount += 1;
    }

    toddlerCounter += 1;
  }

  console.log(
    `Seed selesai: 110 balita, user default, wilayah, dan histori pemeriksaan berhasil dibuat. Simulasi balita belum hadir bulan ini: ${seededAbsentThisMonthCount} anak.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
