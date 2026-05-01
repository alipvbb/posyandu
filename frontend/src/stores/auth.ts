import { defineStore } from 'pinia';
import type { AuthUser } from '../types/models';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../services/api';

const userStorageKey = 'posyandu_auth_user';

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(userStorageKey);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch (_error) {
    localStorage.removeItem(userStorageKey);
    return null;
  }
};

const writeStoredUser = (user: AuthUser | null) => {
  if (!user) {
    localStorage.removeItem(userStorageKey);
    return;
  }
  localStorage.setItem(userStorageKey, JSON.stringify(user));
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser() as AuthUser | null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && tokenStorage.getAccessToken()),
  },
  actions: {
    setUser(user: AuthUser | null) {
      this.user = user;
      writeStoredUser(user);
    },
    clearSession() {
      tokenStorage.clear();
      this.setUser(null);
    },
    hasPermission(permission: string) {
      const explicit = this.user?.permissions.includes(permission) ?? false;
      if (explicit) return true;

      if (this.user?.useCustomPermissions) return false;

      const roleCodes = (this.user?.roles || []).map((role) => role.code);
      if (permission === 'checkups.update' && roleCodes.includes('kader-posyandu')) return true;
      if (permission === 'checkups.update' && roleCodes.includes('petugas-kesehatan')) return true;

      return false;
    },
    async login(payload: { email: string; password: string }) {
      this.loading = true;
      try {
        this.setUser(await authService.login(payload));
      } finally {
        this.loading = false;
      }
    },
    async register(payload: {
      villageName: string;
      villageCode?: string;
      adminName: string;
      email: string;
      phone?: string | null;
      password: string;
    }) {
      this.loading = true;
      try {
        return await authService.register(payload);
      } finally {
        this.loading = false;
      }
    },
    async verifyRegister(payload: { email: string; code: string }) {
      this.loading = true;
      try {
        this.setUser(await authService.verifyRegister(payload));
        return this.user;
      } finally {
        this.loading = false;
      }
    },
    async resendRegisterCode(payload: { email: string }) {
      this.loading = true;
      try {
        return await authService.resendRegisterCode(payload);
      } finally {
        this.loading = false;
      }
    },
    async loadProfile() {
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        this.clearSession();
        return null;
      }

      if (!accessToken && refreshToken) {
        try {
          const refreshedUser = await authService.refreshSession();
          if (refreshedUser) {
            this.setUser(refreshedUser);
            return this.user;
          }
          this.clearSession();
          return null;
        } catch (_error) {
          this.clearSession();
          return null;
        }
      }
      try {
        this.setUser(await authService.me());
        return this.user;
      } catch (error: any) {
        const status = Number(error?.response?.status || 0);
        if (status === 401 || status === 403) {
          if (refreshToken) {
            try {
              const refreshedUser = await authService.refreshSession();
              if (refreshedUser) {
                this.setUser(refreshedUser);
                return this.user;
              }
            } catch (_refreshError) {
              // lanjut clearSession di bawah
            }
          }
          this.clearSession();
          return null;
        }
        // Error jaringan/intermiten: pertahankan sesi lokal agar tidak logout tiba-tiba.
        return this.user;
      }
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        this.clearSession();
      }
    },
  },
});
