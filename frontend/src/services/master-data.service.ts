import { api } from './api';

export const masterDataService = {
  async getAll() {
    const response = await api.get('/master-data');
    return response.data.data;
  },
};

