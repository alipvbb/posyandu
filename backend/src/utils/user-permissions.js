const getRolePermissionCodes = (user) =>
  [...new Set((user.roles || []).flatMap((item) => (item.role?.permissions || []).map((entry) => entry.permission.code)))];

const getCustomPermissionCodes = (user) =>
  [...new Set((user.userPermissions || []).map((item) => item.permission.code))];

const withKaderCheckupUpdatePermission = (roles, permissions, useCustomPermissions) => {
  if (useCustomPermissions) return permissions;
  const nextPermissions = [...permissions];
  const isKader = roles.some((item) => item.role?.code === 'kader-posyandu' || item.code === 'kader-posyandu');
  if (isKader && !nextPermissions.includes('checkups.update')) {
    nextPermissions.push('checkups.update');
  }
  return nextPermissions;
};

export const resolveEffectiveUserPermissions = (user) => {
  const rolePermissions = getRolePermissionCodes(user);
  const customPermissions = getCustomPermissionCodes(user);
  const basePermissions = user.useCustomPermissions ? customPermissions : rolePermissions;

  return withKaderCheckupUpdatePermission(user.roles || [], basePermissions, Boolean(user.useCustomPermissions));
};

export const extractCustomPermissionCodes = (user) => getCustomPermissionCodes(user);
