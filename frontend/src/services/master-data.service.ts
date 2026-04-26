import { api } from './api';

export const masterDataService = {
  async getAll() {
    const response = await api.get('/master-data');
    return response.data.data;
  },
  async getIndonesiaProvinces(params: Record<string, unknown> = {}) {
    const response = await api.get('/master-data/indonesia/provinces', { params });
    return response.data.data || [];
  },
  async getIndonesiaRegencies(provinceCode: string, params: Record<string, unknown> = {}) {
    const response = await api.get(`/master-data/indonesia/regencies/${provinceCode}`, { params });
    return response.data.data || [];
  },
  async getIndonesiaDistricts(regencyCode: string, params: Record<string, unknown> = {}) {
    const response = await api.get(`/master-data/indonesia/districts/${regencyCode}`, { params });
    return response.data.data || [];
  },
  async getIndonesiaVillages(districtCode: string, params: Record<string, unknown> = {}) {
    const response = await api.get(`/master-data/indonesia/villages/${districtCode}`, { params });
    return response.data.data || [];
  },
};
