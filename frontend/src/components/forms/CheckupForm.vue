<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useMasterDataStore } from '../../stores/master-data';
import { clearCheckupDraft, getCheckupDraft, saveCheckupDraft } from '../../utils/offline-drafts';
import AppButton from '../ui/AppButton.vue';
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
  emit('submit', {
    examDate: form.examDate,
    weight: Number(form.weight),
    height: Number(form.height),
    headCircumference: form.headCircumference ? Number(form.headCircumference) : null,
    muac: form.muac ? Number(form.muac) : null,
    officerName: form.officerName,
    posyanduId: Number(form.posyanduId),
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
    <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
      <AppInput v-model="form.examDate" type="date" label="Tanggal pemeriksaan" />
      <AppInput v-model="form.weight" type="number" label="Berat badan (kg)" />
      <AppInput v-model="form.height" type="number" label="Tinggi / panjang badan (cm)" />
      <AppInput v-model="form.headCircumference" type="number" label="Lingkar kepala (cm)" />
      <AppInput v-model="form.muac" type="number" label="Lingkar lengan atas (cm)" />
      <AppInput v-model="form.officerName" label="Nama petugas" />
      <AppSelect
        v-model="form.posyanduId"
        label="Lokasi posyandu"
        :options="masterDataStore.posyandus.map((item) => ({ label: item.name, value: item.id }))"
      />
    </div>

    <label class="form-field">
      <span>Jenis intervensi</span>
      <select v-model="form.interventionTypeIds" class="form-input" multiple size="4">
        <option v-for="item in masterDataStore.interventions" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </label>

    <label class="form-field">
      <span>Imunisasi</span>
      <select v-model="form.immunizationIds" class="form-input" multiple size="4">
        <option v-for="item in masterDataStore.immunizations" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
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
