import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { calculateAgeInMonths, evaluateGrowthStatus } from '../src/services/growth.service.js';

const prisma = new PrismaClient();

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const main = async () => {
  const toddlers = await prisma.toddler.findMany({
    select: {
      id: true,
      birthDate: true,
      gender: true,
      checkups: {
        orderBy: [{ examDate: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          examDate: true,
          weight: true,
          height: true,
          headCircumference: true,
          muac: true,
        },
      },
    },
  });

  let processedCheckups = 0;

  for (const toddler of toddlers) {
    if (!toddler.checkups.length) continue;

    await prisma.$transaction(async (tx) => {
      await tx.growthStatusLog.deleteMany({ where: { toddlerId: toddler.id } });

      let previousCheckup = null;

      for (const checkup of toddler.checkups) {
        const ageInMonths = calculateAgeInMonths(toddler.birthDate, checkup.examDate);
        const evaluation = evaluateGrowthStatus({
          toddler: {
            birthDate: toddler.birthDate,
            gender: toddler.gender,
          },
          currentCheckup: {
            examDate: checkup.examDate,
            ageInMonths,
            weight: toNumber(checkup.weight),
            height: toNumber(checkup.height),
            headCircumference: toNumber(checkup.headCircumference),
            muac: toNumber(checkup.muac),
          },
          previousCheckup,
        });

        await tx.checkup.update({
          where: { id: checkup.id },
          data: {
            ageInMonths: evaluation.ageInMonths,
            growthTrend: evaluation.trend,
            riskLevel: evaluation.riskLevel,
            statusLabel: evaluation.statusLabel,
            growthSummary: evaluation.summary,
          },
        });

        await tx.growthStatusLog.create({
          data: {
            toddlerId: toddler.id,
            checkupId: checkup.id,
            previousCheckupId: previousCheckup?.id || null,
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
          weight: toNumber(checkup.weight),
        };
        processedCheckups += 1;
      }
    });
  }

  console.log(`Recalculation selesai. Total checkup diperbarui: ${processedCheckups}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
