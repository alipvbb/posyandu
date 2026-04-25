import { prisma } from '../../config/prisma.js';

export const getMasterData = async (_req, res, next) => {
  try {
    const [villages, hamlets, rws, rts, posyandus, interventions, immunizations, families] = await Promise.all([
      prisma.village.findMany({ orderBy: { name: 'asc' } }),
      prisma.hamlet.findMany({ orderBy: { name: 'asc' } }),
      prisma.rW.findMany({ orderBy: { name: 'asc' } }),
      prisma.rT.findMany({ orderBy: { name: 'asc' } }),
      prisma.posyandu.findMany({ orderBy: { name: 'asc' } }),
      prisma.interventionType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.immunization.findMany({ orderBy: { recommendedAtMonth: 'asc' } }),
      prisma.family.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          members: {
            select: {
              id: true,
              relationType: true,
              fullName: true,
              nik: true,
              gender: true,
              placeOfBirth: true,
              birthDate: true,
            },
            orderBy: { id: 'asc' },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        villages,
        hamlets,
        rws,
        rts,
        posyandus,
        families,
        interventions,
        immunizations,
        growthStatuses: [
          { code: 'NORMAL', name: 'Normal' },
          { code: 'ATTENTION', name: 'Perlu perhatian' },
          { code: 'STUNTING_RISK', name: 'Risiko stunting' },
          { code: 'UNDERNUTRITION', name: 'Gizi kurang' },
          { code: 'OVERWEIGHT', name: 'Kelebihan berat badan' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
