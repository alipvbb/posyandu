import { prisma } from '../config/prisma.js';

export const writeAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  description,
  meta,
  ipAddress,
  userAgent,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        description,
        meta,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
};

