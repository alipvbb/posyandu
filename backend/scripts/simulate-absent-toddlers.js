import 'dotenv/config';
import dayjs from 'dayjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const parseCount = () => {
  const value = Number(process.env.ABSENT_COUNT || 18);
  if (!Number.isFinite(value) || value <= 0) return 18;
  return Math.min(Math.floor(value), 80);
};

const pickRandom = (items, count) => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, count);
};

const main = async () => {
  const now = dayjs();
  const monthStart = now.startOf('month').toDate();
  const monthEnd = now.endOf('month').toDate();
  const absentCount = parseCount();

  const candidates = await prisma.toddler.findMany({
    where: {
      status: 'ACTIVE',
      checkups: {
        some: {
          examDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      code: true,
      checkups: {
        where: {
          examDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          id: true,
          examDate: true,
        },
      },
    },
  });

  if (!candidates.length) {
    console.log('Tidak ada kandidat hadir bulan ini untuk disimulasikan sebagai tidak hadir.');
    return;
  }

  const selectedToddlers = pickRandom(candidates, Math.min(absentCount, candidates.length));
  const selectedToddlerIds = new Set(selectedToddlers.map((item) => item.id));

  let updatedCheckups = 0;

  await prisma.$transaction(async (tx) => {
    for (const toddler of selectedToddlers) {
      for (const checkup of toddler.checkups) {
        const newExamDate = dayjs(checkup.examDate).subtract(1, 'month').toDate();
        await tx.checkup.update({
          where: { id: checkup.id },
          data: { examDate: newExamDate },
        });
        updatedCheckups += 1;
      }
    }
  });

  const hadirBulanIni = await prisma.checkup.groupBy({
    by: ['toddlerId'],
    where: {
      examDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      toddlerId: {
        notIn: [...selectedToddlerIds],
      },
    },
  });

  console.log(`Simulasi selesai.
- Balita disimulasikan tidak hadir: ${selectedToddlers.length}
- Data pemeriksaan digeser ke bulan lalu: ${updatedCheckups}
- Balita yang masih tercatat hadir bulan ini: ${hadirBulanIni.length}`);
  console.log('Contoh balita tidak hadir (maks 10):');
  for (const toddler of selectedToddlers.slice(0, 10)) {
    console.log(`- ${toddler.code} | ${toddler.fullName}`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

