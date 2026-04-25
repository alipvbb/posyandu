import { prisma } from '../../config/prisma.js';
import { buildMeta, buildPagination } from '../../utils/pagination.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = buildPagination(req.query);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count(),
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

