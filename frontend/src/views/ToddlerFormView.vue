<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppCard from '../components/ui/AppCard.vue';
import ToddlerForm from '../components/forms/ToddlerForm.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { useMasterDataStore } from '../stores/master-data';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const masterDataStore = useMasterDataStore();
const toddler = ref<any>(null);
const loading = ref(false);
const isEdit = computed(() => Boolean(route.params.id));

const submit = async (payload: Record<string, any>) => {
  loading.value = true;
  try {
    if (isEdit.value) {
      await toddlersService.update(String(route.params.id), payload);
      appStore.pushToast('Data balita diperbarui.', 'success');
      router.push(`/balita/${route.params.id}`);
    } else {
      const created = await toddlersService.create(payload);
      appStore.pushToast('Balita baru berhasil ditambahkan.', 'success');
      router.push(`/balita/${created.id}`);
    }
  } catch (error: any) {
    appStore.pushToast(error.response?.data?.message || 'Gagal menyimpan balita.', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await masterDataStore.fetchAll();
  if (isEdit.value) {
    toddler.value = await toddlersService.detail(String(route.params.id));
  }
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">{{ isEdit ? 'Edit balita' : 'Tambah balita' }}</h2>
        <p class="muted-text" style="margin: 6px 0 0">Form mobile-friendly untuk petugas lapangan saat posyandu berlangsung.</p>
      </div>
    </div>

    <AppCard>
      <ToddlerForm :initial-value="toddler" :is-edit="isEdit" :loading="loading" @submit="submit" />
    </AppCard>
  </div>
</template>
