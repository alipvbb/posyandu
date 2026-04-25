<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppCard from '../components/ui/AppCard.vue';
import CheckupForm from '../components/forms/CheckupForm.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { useMasterDataStore } from '../stores/master-data';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const masterDataStore = useMasterDataStore();
const toddler = ref<any>(null);
const initialCheckup = ref<Record<string, any> | null>(null);
const loading = ref(false);
const isEditMode = computed(() => Boolean(route.params.checkupId));

const submit = async (payload: Record<string, any>) => {
  loading.value = true;
  try {
    if (isEditMode.value) {
      await toddlersService.updateCheckup(String(route.params.checkupId), payload);
      appStore.pushToast('Pemeriksaan berhasil diperbarui.', 'success');
    } else {
      await toddlersService.createCheckup(String(route.params.id), payload);
      appStore.pushToast('Pemeriksaan berhasil disimpan.', 'success');
    }
    router.push(`/balita/${route.params.id}`);
  } catch (error: any) {
    appStore.pushToast(error.response?.data?.message || 'Gagal menyimpan pemeriksaan.', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await masterDataStore.fetchAll();
    toddler.value = await toddlersService.detail(String(route.params.id));

    if (isEditMode.value) {
      const checkups = await toddlersService.checkups(String(route.params.id));
      const current = checkups.find((item: any) => String(item.id) === String(route.params.checkupId));
      if (!current) {
        appStore.pushToast('Data pemeriksaan tidak ditemukan.', 'error');
        router.push(`/balita/${route.params.id}`);
        return;
      }
      initialCheckup.value = {
        ...current,
        interventionTypeIds: (current.interventions || []).map((item: any) => item.interventionTypeId),
        immunizationIds: (current.immunizations || []).map((item: any) => item.immunizationId),
      };
    }
  } catch (error: any) {
    appStore.pushToast(error.response?.data?.message || 'Gagal memuat form pemeriksaan.', 'error');
  }
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">{{ isEditMode ? 'Edit Pemeriksaan' : 'Input Pemeriksaan' }}</h2>
        <p class="muted-text" style="margin: 6px 0 0">
          {{ toddler?.nama_lengkap }} • {{ isEditMode ? 'perbarui data pemeriksaan balita.' : 'draft otomatis tersimpan saat offline.' }}
        </p>
      </div>
    </div>

    <AppCard>
      <CheckupForm
        :toddler-id="String(route.params.id)"
        :loading="loading"
        :initial-value="initialCheckup"
        @submit="submit"
      />
    </AppCard>
  </div>
</template>
