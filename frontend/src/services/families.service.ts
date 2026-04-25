import { api } from './api';

export const familiesService = {
  async list(params: Record<string, unknown> = {}) {
    const response = await api.get('/families', { params });
    return response.data;
  },
  async create(payload: Record<string, unknown>) {
    const response = await api.post('/families', payload);
    return response.data.data;
  },
  async update(id: number | string, payload: Record<string, unknown>) {
    const response = await api.put(`/families/${id}`, payload);
    return response.data.data;
  },
  async remove(id: number | string) {
    const response = await api.delete(`/families/${id}`);
    return response.data.data;
  },
};

