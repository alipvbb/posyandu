import { api, tokenStorage } from './api';
import axios from 'axios';

export const authService = {
  async register(payload: {
    villageName: string;
    villageCode?: string;
    adminName: string;
    email: string;
    phone?: string | null;
    password: string;
  }) {
    const response = await api.post('/auth/register', payload);
    return response.data.data as {
      email: string;
      requiresVerification: boolean;
      expiresInMinutes: number;
      delivery: 'email' | 'mock';
      debugCode?: string;
      village: { id: number; name: string; code: string };
    };
  },
  async verifyRegister(payload: { email: string; code: string }) {
    const response = await api.post('/auth/verify-register', payload);
    tokenStorage.setTokens(response.data.data.tokens);
    return response.data.data.user;
  },
  async resendRegisterCode(payload: { email: string }) {
    const response = await api.post('/auth/resend-register-code', payload);
    return response.data.data as {
      email: string;
      expiresInMinutes: number;
      cooldownSeconds: number;
      delivery: 'email' | 'mock';
      debugCode?: string;
    };
  },
  async login(payload: { email: string; password: string }) {
    const response = await api.post('/auth/login', payload);
    tokenStorage.setTokens(response.data.data.tokens);
    return response.data.data.user;
  },
  async forgotPassword(payload: { email: string }) {
    const response = await api.post('/auth/forgot-password', payload);
    return response.data.data as {
      message: string;
      expiresInMinutes: number;
      cooldownSeconds: number;
      delivery?: 'email' | 'mock';
      debugCode?: string;
    };
  },
  async resetPassword(payload: { email: string; code: string; newPassword: string; confirmPassword: string }) {
    const response = await api.post('/auth/reset-password', payload);
    return response.data.data as { message: string };
  },
  async me() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
  async refreshSession() {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    const response = await axios.post('/api/auth/refresh', { refreshToken });
    const payload = response.data?.data;
    if (!payload?.accessToken || !payload?.refreshToken) return null;

    tokenStorage.setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });

    return payload.user ?? null;
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
