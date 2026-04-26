import { ApiError } from './api-error.js';

const GLOBAL_SCOPE_ROLE_CODES = new Set(['super-admin']);

export const hasGlobalVillageScope = (user) =>
  Array.isArray(user?.roles) && user.roles.some((role) => GLOBAL_SCOPE_ROLE_CODES.has(role.code));

export const getActorVillageId = (user, { required = true } = {}) => {
  if (hasGlobalVillageScope(user)) return null;
  const villageId = Number(user?.villageId || 0) || null;
  if (!villageId && required) {
    throw new ApiError(
      403,
      'Akun Anda belum terhubung ke desa. Hubungi administrator sistem untuk mengaitkan desa akun ini.',
    );
  }
  return villageId;
};

export const ensureVillageAccess = (user, targetVillageId, message = 'Anda hanya dapat mengakses data desa Anda') => {
  const actorVillageId = getActorVillageId(user);
  if (actorVillageId === null) return;
  if (!targetVillageId || Number(targetVillageId) !== actorVillageId) {
    throw new ApiError(403, message);
  }
};

export const withVillageIdFilter = (user, field = 'villageId') => {
  const actorVillageId = getActorVillageId(user);
  if (actorVillageId === null) return {};
  return { [field]: actorVillageId };
};

