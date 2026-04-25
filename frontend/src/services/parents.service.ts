import { api } from './api';

type ParentType = 'mother' | 'father';

const toEndpoint = (type: ParentType) => (type === 'mother' ? '/parents/mothers' : '/parents/fathers');

export const parentsService = {
  async list(type: ParentType, params: Record<string, unknown> = {}) {
    const response = await api.get(toEndpoint(type), { params });
    return response.data;
  },
  async create(type: ParentType, payload: Record<string, unknown>) {
    const response = await api.post(toEndpoint(type), payload);
    return response.data.data;
  },
  async update(type: ParentType, id: number | string, payload: Record<string, unknown>) {
    const response = await api.put(`${toEndpoint(type)}/${id}`, payload);
    return response.data.data;
  },
  async remove(type: ParentType, id: number | string) {
    const response = await api.delete(`${toEndpoint(type)}/${id}`);
    return response.data.data;
  },
};

