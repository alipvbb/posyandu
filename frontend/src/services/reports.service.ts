import { api } from './api';

export const reportsService = {
  async getToddlers(params: Record<string, string> = {}) {
    const response = await api.get('/reports/toddlers', { params });
    return response.data.data;
  },
  async getInsights(params: Record<string, string> = {}) {
    const response = await api.get('/reports/insights', { params });
    return response.data.data;
  },
  getExportUrl(type: 'toddlers' | 'checkups' | 'risk', format: 'csv' | 'xlsx' | 'pdf') {
    const token = localStorage.getItem('posyandu_access_token');
    const query = new URLSearchParams({ format, token: token || '' });
    return `${import.meta.env.VITE_API_BASE_URL}/reports/${type}?${query.toString()}`;
  },
};
