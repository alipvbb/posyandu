import { defineStore } from 'pinia';
import { masterDataService } from '../services/master-data.service';

export const useMasterDataStore = defineStore('master-data', {
  state: () => ({
    loaded: false,
    villages: [] as any[],
    hamlets: [] as any[],
    rws: [] as any[],
    rts: [] as any[],
    posyandus: [] as any[],
    families: [] as any[],
    interventions: [] as any[],
    immunizations: [] as any[],
    growthStatuses: [] as any[],
  }),
  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;
      const data = await masterDataService.getAll();
      Object.assign(this, data, { loaded: true });
    },
  },
});
