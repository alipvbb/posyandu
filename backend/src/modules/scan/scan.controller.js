import { prisma } from '../../config/prisma.js';
import { getActorVillageId } from '../../utils/village-scope.js';
import { mapCheckup } from '../balita/balita.shared.js';

const resolveToken = (value) => {
  try {
    const asUrl = new URL(value);
    const parts = asUrl.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
  } catch (_error) {
    return value.replace(/^.*\//, '');
  }
};

export const resolveScan = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const rawValue = req.body.value;
    const token = resolveToken(rawValue);
    const card = await prisma.toddlerCard.findFirst({
      where: {
        OR: [{ publicToken: token }, { qrCodeUrl: rawValue }],
        ...(actorVillageId === null ? {} : { toddler: { family: { is: { villageId: actorVillageId } } } }),
      },
      include: {
        toddler: {
          include: {
            hamlet: true,
            posyandu: true,
            family: true,
            checkups: {
              orderBy: { examDate: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    const toddler =
      card?.toddler ||
      (await prisma.toddler.findFirst({
        where: {
          qrCodeValue: rawValue,
          ...(actorVillageId === null ? {} : { family: { is: { villageId: actorVillageId } } }),
        },
        include: {
          hamlet: true,
          posyandu: true,
          family: true,
          checkups: {
            orderBy: { examDate: 'desc' },
            take: 5,
          },
        },
      }));

    if (!toddler) {
      return res.status(404).json({ success: false, message: 'QR tidak dikenali' });
    }

    res.json({
      success: true,
      data: {
        toddlerId: toddler.id,
        fullName: toddler.fullName,
        code: toddler.code,
        hamlet: toddler.hamlet.name,
        posyandu: toddler.posyandu.name,
        latestCheckup: toddler.checkups[0] ? mapCheckup(toddler.checkups[0], toddler.gender) : null,
        route: `/balita/${toddler.id}`,
        publicRoute: card ? `/public/cards/${card.publicToken}` : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
