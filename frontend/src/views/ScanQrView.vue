<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInput from '../components/ui/AppInput.vue';
import QrScanner from '../components/qr/QrScanner.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';

const router = useRouter();
const appStore = useAppStore();
const manualValue = ref('');
const result = ref<any>(null);
const isProcessing = ref(false);
const showGuideDialog = ref(true);
const showProcessingDialog = ref(false);
const showResultDialog = ref(false);
const showErrorDialog = ref(false);
const errorMessage = ref('');
const lastScannedValue = ref('');
const lastScannedAt = ref(0);

const shouldProcessScan = (value: string) => {
  const now = Date.now();
  if (lastScannedValue.value === value && now - lastScannedAt.value < 2500) {
    return false;
  }
  lastScannedValue.value = value;
  lastScannedAt.value = now;
  return true;
};

const resolveValue = async (value: string, source: 'camera' | 'manual' = 'camera') => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    appStore.pushToast('Nilai QR kosong.', 'error');
    return;
  }
  if (isProcessing.value) return;
  if (source === 'camera' && !shouldProcessScan(normalizedValue)) return;

  isProcessing.value = true;
  showProcessingDialog.value = true;
  showErrorDialog.value = false;

  try {
    result.value = await toddlersService.resolveScan(normalizedValue);
    showResultDialog.value = true;
    appStore.pushToast('QR dikenali.', 'success');
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'QR tidak dapat dikenali.';
    showErrorDialog.value = true;
    appStore.pushToast(errorMessage.value, 'error');
  } finally {
    showProcessingDialog.value = false;
    isProcessing.value = false;
  }
};

const openDetail = () => {
  if (!result.value?.route) return;
  showResultDialog.value = false;
  router.push(result.value.route);
};

const openPublic = () => {
  if (!result.value?.publicRoute) return;
  showResultDialog.value = false;
  router.push(result.value.publicRoute);
};
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Scan QR</h2>
        <p class="muted-text" style="margin: 6px 0 0">Arahkan kamera ke kartu posyandu untuk membuka detail balita dengan cepat.</p>
      </div>
    </div>

    <AppCard>
      <div class="section-head">
        <strong>Kamera scanner</strong>
        <button class="ghost-button" type="button" @click="showGuideDialog = true">Panduan</button>
      </div>
      <QrScanner @scan="resolveValue($event, 'camera')" @error="appStore.pushToast($event, 'error')" />
    </AppCard>

    <AppCard>
      <div class="section-head">
        <strong>Input manual</strong>
      </div>
      <div class="toolbar-row">
        <AppInput v-model="manualValue" label="Nilai QR / URL kartu" />
        <AppButton type="button" :disabled="isProcessing" @click="resolveValue(manualValue, 'manual')">
          {{ isProcessing ? 'Memproses...' : 'Proses' }}
        </AppButton>
      </div>
    </AppCard>

    <AppCard v-if="result">
      <div class="section-head">
        <div>
          <strong>{{ result.fullName }}</strong>
          <p class="muted-text">{{ result.hamlet }} • {{ result.posyandu }}</p>
        </div>
        <button class="app-button" type="button" @click="router.push(result.route)">Buka detail</button>
      </div>
      <p class="muted-text">{{ result.latestCheckup?.statusLabel || 'Belum ada histori pemeriksaan' }}</p>
      <div class="inline-actions">
        <button v-if="result.publicRoute" class="ghost-button" type="button" @click="router.push(result.publicRoute)">Lihat versi orang tua</button>
      </div>
    </AppCard>

    <AppDialog :open="showGuideDialog" title="Panduan Scan QR" @close="showGuideDialog = false">
      <div class="form-grid">
        <p class="muted-text" style="margin: 0">
          Arahkan kamera ke QR pada kartu posyandu. Pastikan QR terlihat penuh, tidak blur, dan pencahayaan cukup.
        </p>
        <div class="form-grid" style="gap: 8px">
          <small>1. Dekatkan kamera 15-30 cm dari kartu.</small>
          <small>2. Tahan kamera 1-2 detik sampai QR terbaca.</small>
          <small>3. Tunggu pop-up hasil scan sebelum pindah halaman.</small>
        </div>
      </div>
    </AppDialog>

    <AppDialog :open="showProcessingDialog" title="Memproses Scan QR" :closable="false">
      <div class="form-grid" style="justify-items: center; text-align: center; padding: 8px 0 4px">
        <span class="loading-spinner" aria-hidden="true" />
        <p class="muted-text" style="margin: 0">Sistem sedang membaca dan mencocokkan data balita...</p>
      </div>
    </AppDialog>

    <AppDialog :open="showResultDialog" title="Hasil Scan QR" @close="showResultDialog = false">
      <div class="form-grid" v-if="result">
        <div>
          <strong>{{ result.fullName }}</strong>
          <p class="muted-text" style="margin: 4px 0 0">{{ result.hamlet }} • {{ result.posyandu }}</p>
        </div>
        <p class="muted-text" style="margin: 0">{{ result.latestCheckup?.statusLabel || 'Belum ada histori pemeriksaan' }}</p>
        <div class="inline-actions">
          <AppButton type="button" @click="openDetail">Buka detail balita</AppButton>
          <AppButton v-if="result.publicRoute" type="button" variant="secondary" @click="openPublic">Lihat versi orang tua</AppButton>
        </div>
      </div>
    </AppDialog>

    <AppDialog :open="showErrorDialog" title="Scan Gagal" @close="showErrorDialog = false">
      <div class="form-grid">
        <p class="muted-text" style="margin: 0">{{ errorMessage }}</p>
        <div class="inline-actions">
          <AppButton type="button" variant="secondary" @click="showGuideDialog = true">Lihat panduan scan</AppButton>
          <AppButton type="button" @click="showErrorDialog = false">Coba lagi</AppButton>
        </div>
      </div>
    </AppDialog>
  </div>
</template>
