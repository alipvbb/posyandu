import { useOnline } from '@vueuse/core';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    toasts: [] as Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>,
    online: navigator.onLine,
    routeLoading: false,
    apiLoadingCount: 0,
  }),
  getters: {
    isLoading: (state) => state.routeLoading || state.apiLoadingCount > 0,
  },
  actions: {
    bindNetworkState() {
      const online = useOnline();
      this.online = online.value;
      window.addEventListener('online', () => {
        this.online = true;
        this.pushToast('Koneksi kembali online.', 'success');
      });
      window.addEventListener('offline', () => {
        this.online = false;
        this.pushToast('Sedang offline. Draft input akan disimpan lokal.', 'info');
      });
    },
    pushToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
      const id = Date.now() + Math.round(Math.random() * 1000);
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter((item) => item.id !== id);
      }, 3200);
    },
    setRouteLoading(value: boolean) {
      this.routeLoading = value;
    },
    startApiLoading() {
      this.apiLoadingCount += 1;
    },
    finishApiLoading() {
      this.apiLoadingCount = Math.max(0, this.apiLoadingCount - 1);
    },
  },
});
