import { api } from './api';

export const toddlersService = {
  async list(params: Record<string, unknown> = {}) {
    const response = await api.get('/toddlers', { params });
    return response.data;
  },
  async detail(id: number | string) {
    const response = await api.get(`/toddlers/${id}`);
    return response.data.data;
  },
  async create(payload: Record<string, unknown>) {
    const response = await api.post('/toddlers', payload);
    return response.data.data;
  },
  async update(id: number | string, payload: Record<string, unknown>) {
    const response = await api.put(`/toddlers/${id}`, payload);
    return response.data.data;
  },
  async remove(id: number | string) {
    const response = await api.delete(`/toddlers/${id}`);
    return response.data.data;
  },
  async checkups(id: number | string) {
    const response = await api.get(`/toddlers/${id}/checkups`);
    return response.data.data;
  },
  async monthlyCheckups(month: string) {
    const response = await api.get('/checkups/monthly', { params: { month } });
    return response.data.data;
  },
  async dailyCheckups(date: string) {
    const month = String(date || '').slice(0, 7);
    const response = await api.get('/checkups/monthly', { params: { month } });
    return response.data.data;
  },
  async createCheckup(id: number | string, payload: Record<string, unknown>) {
    const response = await api.post(`/toddlers/${id}/checkups`, payload);
    return response.data.data;
  },
  async updateCheckup(id: number | string, payload: Record<string, unknown>) {
    const response = await api.put(`/checkups/${id}`, payload);
    return response.data.data;
  },
  async deleteCheckup(id: number | string) {
    const response = await api.delete(`/checkups/${id}`);
    return response.data.data;
  },
  async getQr(id: number | string) {
    const response = await api.get(`/qrcode/${id}`);
    return response.data.data;
  },
  async getCard(id: number | string) {
    const response = await api.get(`/cards/${id}`);
    return response.data.data;
  },
  async resolveScan(value: string) {
    const response = await api.post('/scan/resolve', { value });
    return response.data.data;
  },
  async getPublicCard(token: string, years: string | number) {
    const response = await api.get(`/cards/public/${token}`, { params: { years } });
    return response.data.data;
  },
};
