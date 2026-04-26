import { prisma } from '../../config/prisma.js';
import { indonesiaRegionService } from '../../services/indonesia-region.service.js';
import { getActorVillageId } from '../../utils/village-scope.js';

const filterRegionItems = (items, query) => {
  const search = String(query?.q || '')
    .trim()
    .toLowerCase();
  const limit = Number(query?.limit || 0);
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 500;
  const filtered = search ? items.filter((item) => item.name.toLowerCase().includes(search)) : items;
  return filtered.slice(0, normalizedLimit);
};

export const getMasterData = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const villages = await prisma.village.findMany({
      where: actorVillageId === null ? undefined : { id: actorVillageId },
      orderBy: { name: 'asc' },
    });

    const hamlets = await prisma.hamlet.findMany({
      where: actorVillageId === null ? undefined : { villageId: actorVillageId },
      orderBy: { name: 'asc' },
    });
    const hamletIds = hamlets.map((item) => item.id);

    const rws = await prisma.rW.findMany({
      where: actorVillageId === null ? undefined : { hamletId: { in: hamletIds.length ? hamletIds : [-1] } },
      orderBy: { name: 'asc' },
    });
    const rwIds = rws.map((item) => item.id);

    const [rts, posyandus, interventions, immunizations, families] = await Promise.all([
      prisma.rT.findMany({
        where: actorVillageId === null ? undefined : { rwId: { in: rwIds.length ? rwIds : [-1] } },
        orderBy: { name: 'asc' },
      }),
      prisma.posyandu.findMany({
        where: actorVillageId === null ? undefined : { villageId: actorVillageId },
        orderBy: { name: 'asc' },
      }),
      prisma.interventionType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.immunization.findMany({ orderBy: { recommendedAtMonth: 'asc' } }),
      prisma.family.findMany({
        where: actorVillageId === null ? undefined : { villageId: actorVillageId },
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

export const listIndonesiaProvinces = async (req, res, next) => {
  try {
    const items = await indonesiaRegionService.getProvinces();
    res.json({ success: true, data: filterRegionItems(items, req.query) });
  } catch (error) {
    next(error);
  }
};

export const listIndonesiaRegencies = async (req, res, next) => {
  try {
    const items = await indonesiaRegionService.getRegencies(req.params.provinceCode);
    res.json({ success: true, data: filterRegionItems(items, req.query) });
  } catch (error) {
    next(error);
  }
};

export const listIndonesiaDistricts = async (req, res, next) => {
  try {
    const items = await indonesiaRegionService.getDistricts(req.params.regencyCode);
    res.json({ success: true, data: filterRegionItems(items, req.query) });
  } catch (error) {
    next(error);
  }
};

export const listIndonesiaVillages = async (req, res, next) => {
  try {
    const items = await indonesiaRegionService.getVillages(req.params.districtCode);
    res.json({ success: true, data: filterRegionItems(items, req.query) });
  } catch (error) {
    next(error);
  }
};
