import { prisma } from '../../config/prisma.js';
import { buildMeta, buildPagination } from '../../utils/pagination.js';
import { getActorVillageId } from '../../utils/village-scope.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const { page, pageSize, skip, take } = buildPagination(req.query);
    const where = actorVillageId === null ? {} : { user: { villageId: actorVillageId } };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      meta: buildMeta({ page, pageSize, total }),
    });
  } catch (error) {
    next(error);
  }
};
