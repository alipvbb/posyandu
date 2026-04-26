import { prisma } from '../../config/prisma.js';
import { getActorVillageId } from '../../utils/village-scope.js';

export const listPosyandus = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const items = await prisma.posyandu.findMany({
      where: actorVillageId === null ? undefined : { villageId: actorVillageId },
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
