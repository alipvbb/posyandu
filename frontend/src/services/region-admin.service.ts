import { api } from './api';

export const regionAdminService = {
  async listHamlets(params: Record<string, unknown> = {}) {
    const response = await api.get('/posyandu/hamlets', { params });
    return response.data.data || [];
  },
  async createHamlet(payload: { name: string }) {
    const response = await api.post('/posyandu/hamlets', payload);
    return response.data.data;
  },
  async updateHamlet(id: number, payload: { name: string }) {
    const response = await api.put(`/posyandu/hamlets/${id}`, payload);
    return response.data.data;
  },
  async deleteHamlet(id: number) {
    const response = await api.delete(`/posyandu/hamlets/${id}`);
    return response.data.data;
  },
  async listRws(params: Record<string, unknown> = {}) {
    const response = await api.get('/posyandu/rws', { params });
    return response.data.data || [];
  },
  async createRw(payload: { hamletId: number; name: string }) {
    const response = await api.post('/posyandu/rws', payload);
    return response.data.data;
  },
  async updateRw(id: number, payload: { hamletId?: number; name?: string }) {
    const response = await api.put(`/posyandu/rws/${id}`, payload);
    return response.data.data;
  },
  async deleteRw(id: number) {
    const response = await api.delete(`/posyandu/rws/${id}`);
    return response.data.data;
  },
  async listRts(params: Record<string, unknown> = {}) {
    const response = await api.get('/posyandu/rts', { params });
    return response.data.data || [];
  },
  async createRt(payload: { rwId: number; name: string }) {
    const response = await api.post('/posyandu/rts', payload);
    return response.data.data;
  },
  async updateRt(id: number, payload: { rwId?: number; name?: string }) {
    const response = await api.put(`/posyandu/rts/${id}`, payload);
    return response.data.data;
  },
  async deleteRt(id: number) {
    const response = await api.delete(`/posyandu/rts/${id}`);
    return response.data.data;
  },
  async listPosyandus(params: Record<string, unknown> = {}) {
    const response = await api.get('/posyandu', { params });
    return response.data.data || [];
  },
  async createPosyandu(payload: {
    hamletId: number;
    name: string;
    locationAddress?: string | null;
    scheduleDay?: string | null;
    contactPhone?: string | null;
  }) {
    const response = await api.post('/posyandu', payload);
    return response.data.data;
  },
  async updatePosyandu(
    id: number,
    payload: {
      hamletId?: number;
      name?: string;
      locationAddress?: string | null;
      scheduleDay?: string | null;
      contactPhone?: string | null;
    },
  ) {
    const response = await api.put(`/posyandu/${id}`, payload);
    return response.data.data;
  },
  async deletePosyandu(id: number) {
    const response = await api.delete(`/posyandu/${id}`);
    return response.data.data;
  },
};

