<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useMasterDataStore } from '../../stores/master-data';
import { useAppStore } from '../../stores/app';
import { clearCheckupDraft, getCheckupDraft, saveCheckupDraft } from '../../utils/offline-drafts';
import AppButton from '../ui/AppButton.vue';
import AppInfoNote from '../ui/AppInfoNote.vue';
import AppInput from '../ui/AppInput.vue';
import AppSelect from '../ui/AppSelect.vue';

const props = defineProps<{
  toddlerId: number | string;
  initialValue?: Record<string, any> | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit', value: Record<string, any>): void;
}>();

const masterDataStore = useMasterDataStore();
const appStore = useAppStore();

const form = reactive({
  examDate: new Date().toISOString().slice(0, 10),
  weight: '',
  height: '',
  headCircumference: '',
  muac: '',
  officerName: 'Bidan Desa',
  posyanduId: '',
  immunizationNote: '',
  vitaminPmtNote: '',
  complaintNote: '',
  interventionTypeIds: [] as number[],
  immunizationIds: [] as number[],
});

const submit = async () => {
  const weight = Number(form.weight);
  const height = Number(form.height);
  const posyanduId = Number(form.posyanduId);

  if (!form.examDate || !form.weight || !form.height || !form.officerName || !posyanduId) {
    appStore.pushToast('Lengkapi tanggal, berat badan, tinggi/panjang badan, petugas, dan lokasi posyandu dulu.', 'error');
    return;
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > 40) {
    appStore.pushToast('Berat badan tidak valid. Isi dalam kilogram, contoh 8.5.', 'error');
    return;
  }

  if (!Number.isFinite(height) || height < 35 || height > 130) {
    appStore.pushToast('Tinggi/panjang badan tidak valid. Isi dalam cm, contoh 74.5.', 'error');
    return;
  }

  emit('submit', {
    examDate: form.examDate,
    weight,
    height,
    headCircumference: form.headCircumference ? Number(form.headCircumference) : null,
    muac: form.muac ? Number(form.muac) : null,
    officerName: form.officerName,
    posyanduId,
    immunizationNote: form.immunizationNote || null,
    vitaminPmtNote: form.vitaminPmtNote || null,
    complaintNote: form.complaintNote || null,
    interventionTypeIds: form.interventionTypeIds,
    immunizationIds: form.immunizationIds,
  });

  await clearCheckupDraft(props.toddlerId);
};

watch(
  form,
  async () => {
    await saveCheckupDraft(props.toddlerId, form);
  },
  { deep: true },
);

watch(
  () => props.initialValue,
  (value) => {
    if (!value) return;
    form.examDate = value.examDate?.slice?.(0, 10) || form.examDate;
    form.weight = String(value.weight || '');
    form.height = String(value.height || '');
    form.headCircumference = String(value.headCircumference || '');
    form.muac = String(value.muac || '');
    form.officerName = value.officerName || 'Bidan Desa';
    form.posyanduId = String(value.posyanduId || '');
    form.immunizationNote = value.immunizationNote || '';
    form.vitaminPmtNote = value.vitaminPmtNote || '';
    form.complaintNote = value.complaintNote || '';
    form.interventionTypeIds = Array.isArray(value.interventionTypeIds)
      ? value.interventionTypeIds.map((item: unknown) => Number(item)).filter((item: number) => Number.isFinite(item))
      : [];
    form.immunizationIds = Array.isArray(value.immunizationIds)
      ? value.immunizationIds.map((item: unknown) => Number(item)).filter((item: number) => Number.isFinite(item))
      : [];
  },
  { immediate: true },
);

onMounted(async () => {
  const draft = await getCheckupDraft<typeof form>(props.toddlerId);
  if (!props.initialValue && draft) {
    Object.assign(form, draft);
  }
});
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <AppInfoNote title="Sebelum simpan pemeriksaan">
      Isi minimal tanggal pemeriksaan, berat badan, tinggi/panjang badan, nama petugas, dan lokasi posyandu. Data ini akan menjadi histori, bukan menimpa pemeriksaan lama.
    </AppInfoNote>
    <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
      <AppInput v-model="form.examDate" type="date" label="Tanggal pemeriksaan" required />
      <AppInput v-model="form.weight" type="number" label="Berat badan (kg)" required inputmode="decimal" min="0.1" step="0.01" hint="Gunakan kg, contoh 8.5" />
      <AppInput v-model="form.height" type="number" label="Tinggi / panjang badan (cm)" required inputmode="decimal" min="35" step="0.1" hint="Gunakan cm, contoh 74.5" />
      <AppInput v-model="form.headCircumference" type="number" label="Lingkar kepala (cm)" inputmode="decimal" step="0.1" hint="Opsional" />
      <AppInput v-model="form.muac" type="number" label="Lingkar lengan atas (cm)" inputmode="decimal" step="0.1" hint="Opsional" />
      <AppInput v-model="form.officerName" label="Nama petugas" required />
      <AppSelect
        v-model="form.posyanduId"
        label="Lokasi posyandu"
        required
        :options="masterDataStore.posyandus.map((item) => ({ label: item.name, value: item.id }))"
        empty-hint="Data posyandu belum tersedia. Lengkapi dulu di menu Pengaturan."
      />
    </div>

    <label class="form-field">
      <span>Jenis intervensi</span>
      <select v-model="form.interventionTypeIds" class="form-input" multiple size="4" :disabled="!masterDataStore.interventions.length">
        <option v-for="item in masterDataStore.interventions" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <small v-if="!masterDataStore.interventions.length" class="muted-text">
        Data jenis intervensi masih kosong. Sistem akan otomatis mengisi data default saat master data dimuat ulang.
      </small>
    </label>

    <label class="form-field">
      <span>Imunisasi</span>
      <select v-model="form.immunizationIds" class="form-input" multiple size="4" :disabled="!masterDataStore.immunizations.length">
        <option v-for="item in masterDataStore.immunizations" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <small v-if="!masterDataStore.immunizations.length" class="muted-text">
        Data imunisasi masih kosong. Sistem akan otomatis mengisi data default saat master data dimuat ulang.
      </small>
    </label>

    <label class="form-field">
      <span>Status imunisasi / catatan</span>
      <textarea v-model="form.immunizationNote" class="form-input" rows="2" />
    </label>
    <label class="form-field">
      <span>Vitamin / PMT / intervensi</span>
      <textarea v-model="form.vitaminPmtNote" class="form-input" rows="2" />
    </label>
    <label class="form-field">
      <span>Keluhan / catatan</span>
      <textarea v-model="form.complaintNote" class="form-input" rows="3" />
    </label>

    <div class="checkup-submit-sticky">
      <AppButton type="submit" :disabled="loading" data-block="true">
        {{ loading ? 'Menyimpan...' : initialValue ? 'Update pemeriksaan' : 'Simpan pemeriksaan' }}
      </AppButton>
    </div>
  </form>
</template>
