import { prisma } from '../../config/prisma.js';

export const listPermissions = async (_req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

