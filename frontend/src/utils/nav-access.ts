const STORAGE_KEY = 'posyandu_bottom_nav_hidden_by_role_v1';
export const BOTTOM_NAV_CHANGED_EVENT = 'posyandu:bottom-nav-changed';

type NavAccessMap = Record<string, string[]>;

const readMap = (): NavAccessMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as NavAccessMap;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (_error) {
    return {};
  }
};

const writeMap = (value: NavAccessMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BOTTOM_NAV_CHANGED_EVENT));
  }
};

export const getHiddenBottomNavKeys = (roleCode?: string | null): string[] => {
  if (!roleCode) return [];
  const map = readMap();
  return Array.isArray(map[roleCode]) ? map[roleCode] : [];
};

export const setHiddenBottomNavKeys = (roleCode: string, keys: string[]) => {
  const map = readMap();
  map[roleCode] = [...new Set(keys)];
  writeMap(map);
};
