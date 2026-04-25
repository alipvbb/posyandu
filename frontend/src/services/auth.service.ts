import { api, tokenStorage } from './api';

export const authService = {
  async login(payload: { email: string; password: string }) {
    const response = await api.post('/auth/login', payload);
    tokenStorage.setTokens(response.data.data.tokens);
    return response.data.data.user;
  },
  async me() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
  async logout() {
    await api.post('/auth/logout');
    tokenStorage.clear();
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const response = await api.post('/auth/change-password', payload);
    return response.data.data;
  },
};

