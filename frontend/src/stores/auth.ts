import { defineStore } from 'pinia';
import type { AuthUser } from '../types/models';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && tokenStorage.getAccessToken()),
  },
  actions: {
    hasPermission(permission: string) {
      const explicit = this.user?.permissions.includes(permission) ?? false;
      if (explicit) return true;

      const roleCodes = (this.user?.roles || []).map((role) => role.code);
      if (permission === 'checkups.update' && roleCodes.includes('kader-posyandu')) return true;
      if (permission === 'checkups.update' && roleCodes.includes('petugas-kesehatan')) return true;

      return false;
    },
    async login(payload: { email: string; password: string }) {
      this.loading = true;
      try {
        this.user = await authService.login(payload);
      } finally {
        this.loading = false;
      }
    },
    async loadProfile() {
      if (!tokenStorage.getAccessToken()) return null;
      try {
        this.user = await authService.me();
        return this.user;
      } catch (_error) {
        tokenStorage.clear();
        this.user = null;
        return null;
      }
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        tokenStorage.clear();
        this.user = null;
      }
    },
  },
});
