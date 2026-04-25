import { prisma } from '../../config/prisma.js';

export const listPosyandus = async (_req, res, next) => {
  try {
    const items = await prisma.posyandu.findMany({
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

