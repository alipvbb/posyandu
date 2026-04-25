import { prisma } from '../../config/prisma.js';
import { writeAuditLog } from '../../services/audit.service.js';

const roleInclude = {
  permissions: {
    include: {
      permission: true,
    },
  },
};

export const listRoles = async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: roleInclude,
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      data: roles.map((role) => ({
        ...role,
        permissions: role.permissions.map((item) => item.permission),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (req, res, next) => {
  try {
    const roleId = req.validated.params.id;
    const { permissionIds, permissionCodes } = req.validated.body;
    const permissions = permissionIds?.length
      ? await prisma.permission.findMany({ where: { id: { in: permissionIds } } })
      : await prisma.permission.findMany({ where: { code: { in: permissionCodes || [] } } });

    const role = await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      return tx.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            create: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
        include: roleInclude,
      });
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE_ROLE_PERMISSIONS',
      entityType: 'Role',
      entityId: roleId,
      description: `Memperbarui permission role ${role.name}`,
      meta: { permissionCount: permissions.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map((item) => item.permission),
      },
    });
  } catch (error) {
    next(error);
  }
};

