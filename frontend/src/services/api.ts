import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAppStore } from '../stores/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const storageKeys = {
  accessToken: 'posyandu_access_token',
  refreshToken: 'posyandu_refresh_token',
};

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(storageKeys.accessToken),
  getRefreshToken: () => localStorage.getItem(storageKeys.refreshToken),
  setTokens: ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem(storageKeys.accessToken, accessToken);
    localStorage.setItem(storageKeys.refreshToken, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(storageKeys.accessToken);
    localStorage.removeItem(storageKeys.refreshToken);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

type RequestConfigWithMeta = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipGlobalLoading?: boolean;
  _globalLoadingTracked?: boolean;
};

const stopGlobalLoading = (config?: RequestConfigWithMeta | null) => {
  if (!config?._globalLoadingTracked) return;
  const appStore = useAppStore();
  appStore.finishApiLoading();
  config._globalLoadingTracked = false;
};

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const requestConfig = config as RequestConfigWithMeta;
  if (!requestConfig.skipGlobalLoading) {
    const appStore = useAppStore();
    appStore.startApiLoading();
    requestConfig._globalLoadingTracked = true;
  }

  return requestConfig;
});

let refreshingPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => {
    stopGlobalLoading(response.config as RequestConfigWithMeta);
    return response;
  },
  async (error) => {
    const requestConfig = error.config as RequestConfigWithMeta | undefined;
    stopGlobalLoading(requestConfig);

    if (error.response?.status !== 401 || requestConfig?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    if (!refreshingPromise) {
      refreshingPromise = axios
        .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        .then((response) => {
          tokenStorage.setTokens(response.data.data);
          return response.data.data.accessToken as string;
        })
        .catch(() => {
          tokenStorage.clear();
          return null;
        })
        .finally(() => {
          refreshingPromise = null;
        });
    }

    const newAccessToken = await refreshingPromise;
    if (!newAccessToken) {
      return Promise.reject(error);
    }

    if (!requestConfig) {
      return Promise.reject(error);
    }

    requestConfig._retry = true;
    requestConfig.headers.Authorization = `Bearer ${newAccessToken}`;
    return api.request(requestConfig);
  },
);
