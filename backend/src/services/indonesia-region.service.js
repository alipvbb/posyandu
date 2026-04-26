const DAY_MS = 24 * 60 * 60 * 1000;

const cache = new Map();

const normalizeRegionList = (items = []) =>
  items
    .map((item) => ({
      code: String(item.id || '').trim(),
      name: String(item.name || '').trim(),
    }))
    .filter((item) => item.code && item.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));

const providers = [
  {
    name: 'emsifa',
    buildPath: {
      provinces: () => 'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
      regencies: (code) => `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${code}.json`,
      districts: (code) => `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${code}.json`,
      villages: (code) => `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${code}.json`,
    },
    mapItem: (item) => ({ id: item?.id, name: item?.name }),
  },
  {
    name: 'ibnux',
    buildPath: {
      provinces: () => 'https://ibnux.github.io/data-indonesia/provinsi.json',
      regencies: (code) => `https://ibnux.github.io/data-indonesia/kabupaten/${code}.json`,
      districts: (code) => `https://ibnux.github.io/data-indonesia/kecamatan/${code}.json`,
      villages: (code) => `https://ibnux.github.io/data-indonesia/kelurahan/${code}.json`,
    },
    mapItem: (item) => ({ id: item?.id, name: item?.nama }),
  },
];

const fetchWithProvider = async (provider, type, code) => {
  const urlBuilder = provider.buildPath[type];
  if (!urlBuilder) return [];
  const url = urlBuilder(code);
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${provider.name}:${response.status}`);
  }
  const payload = await response.json();
  const mapped = Array.isArray(payload) ? payload.map(provider.mapItem) : [];
  return normalizeRegionList(mapped);
};

const fetchRegions = async (type, code = '') => {
  let lastError = null;
  for (const provider of providers) {
    try {
      const items = await fetchWithProvider(provider, type, code);
      if (items.length) return items;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(lastError?.message || `Gagal memuat data wilayah ${type}`);
};

const getCached = async (key, loader, ttlMs = DAY_MS) => {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
};

export const indonesiaRegionService = {
  async getProvinces() {
    return getCached('provinces', () => fetchRegions('provinces'));
  },
  async getRegencies(provinceCode) {
    const code = String(provinceCode || '').trim();
    if (!code) return [];
    return getCached(`regencies:${code}`, () => fetchRegions('regencies', code));
  },
  async getDistricts(regencyCode) {
    const code = String(regencyCode || '').trim();
    if (!code) return [];
    return getCached(`districts:${code}`, () => fetchRegions('districts', code));
  },
  async getVillages(districtCode) {
    const code = String(districtCode || '').trim();
    if (!code) return [];
    return getCached(`villages:${code}`, () => fetchRegions('villages', code));
  },
};
