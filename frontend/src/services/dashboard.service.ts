import { api } from './api';

export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },
  async getRisk() {
    const response = await api.get('/dashboard/risk');
    return response.data.data;
  },
};

