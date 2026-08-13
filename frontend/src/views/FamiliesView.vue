<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInfoNote from '../components/ui/AppInfoNote.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';
import { familiesService } from '../services/families.service';
import { masterDataService } from '../services/master-data.service';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { useMasterDataStore } from '../stores/master-data';
import { extractApiErrorMessage } from '../utils/feedback';

const appStore = useAppStore();
const authStore = useAuthStore();
const masterDataStore = useMasterDataStore();

const loading = ref(true);
const items = ref<any[]>([]);
const meta = ref<any>(null);
const openForm = ref(false);
const editingId = ref<number | null>(null);
const confirmDeleteId = ref<number | null>(null);
const hydratingDomicile = ref(false);
const saving = ref(false);

const filters = reactive({
  search: '',
  page: 1,
  pageSize: 10,
});

const form = reactive({
  familyNumber: '',
  headName: '',
  address: '',
  phone: '',
  villageId: '',
  hamletId: '',
  rwId: '',
  rtId: '',
  domicileProvinceCode: '',
  domicileRegencyCode: '',
  domicileDistrictCode: '',
  domicileVillageCode: '',
  domicileRw: '',
  domicileRt: '',
  members: [] as Array<{
    relationType: string;
    fullName: string;
    nik: string;
    gender: 'MALE' | 'FEMALE';
    placeOfBirth: string;
    birthDate: string;
    religion: string;
    education: string;
    occupation: string;
    maritalStatus: string;
    citizenship: string;
    fatherName: string;
    motherName: string;
    relationshipStatus: string;
  }>,
});

const domicileOptions = reactive({
  provinces: [] as Array<{ code: string; name: string }>,
  regencies: [] as Array<{ code: string; name: string }>,
  districts: [] as Array<{ code: string; name: string }>,
  villages: [] as Array<{ code: string; name: string }>,
});

const domicileLoading = reactive({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false,
});

const createDefaultMembers = (headName = '') => [createMember('KEPALA KELUARGA', 'MALE', headName)];

const createCompleteKkTemplate = (headName = '') => [
  createMember('KEPALA KELUARGA', 'MALE', headName),
  createMember('ISTRI', 'FEMALE', ''),
  createMember('ANAK', 'MALE', ''),
];

const createMember = (
  relationType = 'ANAK',
  gender: 'MALE' | 'FEMALE' = 'MALE',
  fullName = '',
) => ({
  relationType,
  fullName,
  nik: '',
  gender,
  placeOfBirth: '',
  birthDate: '',
  religion: '',
  education: '',
  occupation: '',
  maritalStatus: '',
  citizenship: 'WNI',
  fatherName: '',
  motherName: '',
  relationshipStatus: '',
});

const digitsOnly = (value: string | number | null | undefined) => String(value || '').replace(/\D/g, '');

const addMember = (relationType = 'ANAK', gender: 'MALE' | 'FEMALE' = 'MALE') => {
  form.members.push(createMember(relationType, gender));
};

const relationTypeOptions = [
  'KEPALA KELUARGA',
  'SUAMI',
  'ISTRI',
  'AYAH',
  'IBU',
  'ANAK',
  'MENANTU',
  'CUCU',
  'ORANG TUA',
  'MERTUA',
  'FAMILI LAIN',
  'PEMBANTU',
  'LAINNYA',
];

const childCount = (row: any) =>
  Array.isArray(row?.members)
    ? row.members.filter((item: any) => ['ANAK', 'CUCU'].includes(String(item.relationType || '').toUpperCase())).length
    : 0;

const removeMember = (index: number) => {
  if (form.members.length <= 1) {
    appStore.pushToast('Minimal harus ada 1 anggota keluarga.', 'error');
    return;
  }
  form.members.splice(index, 1);
};

const normalizeLocationName = (value: string | null | undefined) =>
  String(value || '')
    .toUpperCase()
    .replace(/^(DESA|KELURAHAN|KEL\.|DS\.)\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');

const domicileProvinceOptions = computed(() =>
  domicileOptions.provinces.map((item) => ({ label: item.name, value: item.code })),
);

const domicileRegencyOptions = computed(() =>
  domicileOptions.regencies.map((item) => ({ label: item.name, value: item.code })),
);

const domicileDistrictOptions = computed(() =>
  domicileOptions.districts.map((item) => ({ label: item.name, value: item.code })),
);

const domicileVillageOptions = computed(() =>
  domicileOptions.villages.map((item) => ({ label: item.name, value: item.code })),
);

const getRegionNameByCode = (items: Array<{ code: string; name: string }>, code: string) =>
  items.find((item) => String(item.code) === String(code))?.name || null;

const selectedDomicileVillageName = computed(() =>
  getRegionNameByCode(domicileOptions.villages, form.domicileVillageCode),
);

const matchedLocalVillageIds = computed(() => {
  const normalizedDomicileVillage = normalizeLocationName(selectedDomicileVillageName.value);
  if (!normalizedDomicileVillage) return [] as number[];
  return masterDataStore.villages
    .filter((item: any) => normalizeLocationName(item.name) === normalizedDomicileVillage)
    .map((item: any) => item.id);
});

const actorVillageId = computed(() => Number(authStore.user?.village?.id || 0) || null);

const normalizeId = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const localVillageOptions = computed(() => {
  const source = actorVillageId.value
    ? masterDataStore.villages.filter((item: any) => item.id === actorVillageId.value)
    : masterDataStore.villages;
  return source.map((item: any) => ({ label: item.name, value: String(item.id) }));
});

const selectedLocalVillageId = computed(() => normalizeId(form.villageId));

const localHamletOptions = computed(() =>
  masterDataStore.hamlets
    .filter((item: any) => item.villageId === selectedLocalVillageId.value)
    .map((item: any) => ({ label: item.name, value: String(item.id) })),
);

const selectedLocalHamletId = computed(() => normalizeId(form.hamletId));

const localRwOptions = computed(() =>
  masterDataStore.rws
    .filter((item: any) => item.hamletId === selectedLocalHamletId.value)
    .map((item: any) => ({ label: item.name, value: String(item.id) })),
);

const selectedLocalRwId = computed(() => normalizeId(form.rwId));

const localRtOptions = computed(() =>
  masterDataStore.rts
    .filter((item: any) => item.rwId === selectedLocalRwId.value)
    .map((item: any) => ({ label: item.name, value: String(item.id) })),
);

const serviceReadinessItems = computed(() => [
  {
    label: 'Desa',
    status: localVillageOptions.value.length ? 'ready' : 'missing',
    text: localVillageOptions.value.length
      ? `${localVillageOptions.value.length} desa tersedia untuk akun ini`
      : 'Desa akun belum tersedia',
  },
  {
    label: 'Dusun',
    status: !form.villageId ? 'waiting' : localHamletOptions.value.length ? 'ready' : 'missing',
    text: !form.villageId
      ? 'Pilih desa layanan dulu'
      : localHamletOptions.value.length
        ? `${localHamletOptions.value.length} dusun tersedia`
        : 'Belum ada dusun di desa ini',
  },
  {
    label: 'RW',
    status: !form.hamletId ? 'waiting' : localRwOptions.value.length ? 'ready' : 'missing',
    text: !form.hamletId
      ? 'Pilih dusun dulu'
      : localRwOptions.value.length
        ? `${localRwOptions.value.length} RW di dusun ini`
        : 'Belum ada RW di dusun ini',
  },
  {
    label: 'RT',
    status: !form.rwId ? 'waiting' : localRtOptions.value.length ? 'ready' : 'missing',
    text: !form.rwId
      ? 'Pilih RW dulu'
      : localRtOptions.value.length
        ? `${localRtOptions.value.length} RT di RW ini`
        : 'Belum ada RT di RW ini',
  },
]);

const hasMissingServiceData = computed(() => serviceReadinessItems.value.some((item) => item.status === 'missing'));

const getDefaultServiceVillageId = () => {
  const matchedIds = matchedLocalVillageIds.value;
  if (matchedIds.length === 1) return matchedIds[0];
  if (actorVillageId.value) return actorVillageId.value;
  return masterDataStore.villages[0]?.id || null;
};

const ensureLocalServiceDefaults = (preferMatchedVillage = true) => {
  const preferredVillageId = preferMatchedVillage ? getDefaultServiceVillageId() : actorVillageId.value;
  const currentVillageId = normalizeId(form.villageId);
  const villageOptions = localVillageOptions.value;
  const allowedVillageIds = villageOptions.map((item) => normalizeId(item.value)).filter((item): item is number => item !== null);
  const finalVillageId =
    (currentVillageId && allowedVillageIds.includes(currentVillageId) ? currentVillageId : null) ||
    (preferredVillageId && allowedVillageIds.includes(preferredVillageId) ? preferredVillageId : null) ||
    allowedVillageIds[0] ||
    null;
  if (!finalVillageId) return;

  form.villageId = String(finalVillageId);
  const hamletOptions = masterDataStore.hamlets.filter((item: any) => item.villageId === finalVillageId);
  const currentHamletId = normalizeId(form.hamletId);
  const finalHamletId =
    (currentHamletId && hamletOptions.some((item: any) => item.id === currentHamletId) ? currentHamletId : null) ||
    hamletOptions[0]?.id ||
    null;
  if (!finalHamletId) {
    form.hamletId = '';
    form.rwId = '';
    form.rtId = '';
    return;
  }

  form.hamletId = String(finalHamletId);
  const rwOptions = masterDataStore.rws.filter((item: any) => item.hamletId === finalHamletId);
  const currentRwId = normalizeId(form.rwId);
  const finalRwId =
    (currentRwId && rwOptions.some((item: any) => item.id === currentRwId) ? currentRwId : null) ||
    rwOptions[0]?.id ||
    null;
  if (!finalRwId) {
    form.rwId = '';
    form.rtId = '';
    return;
  }

  form.rwId = String(finalRwId);
  const rtOptions = masterDataStore.rts.filter((item: any) => item.rwId === finalRwId);
  const currentRtId = normalizeId(form.rtId);
  const finalRtId =
    (currentRtId && rtOptions.some((item: any) => item.id === currentRtId) ? currentRtId : null) ||
    rtOptions[0]?.id ||
    null;
  if (!finalRtId) {
    form.rtId = '';
    return;
  }

  form.rtId = String(finalRtId);
};

const loadDomicileProvinces = async (showError = true) => {
  domicileLoading.provinces = true;
  try {
    domicileOptions.provinces = await masterDataService.getIndonesiaProvinces({ limit: 200 });
  } catch (_error) {
    if (showError) appStore.pushToast('Gagal memuat daftar provinsi Indonesia.', 'error');
  } finally {
    domicileLoading.provinces = false;
  }
};

const loadDomicileRegencies = async (provinceCode: string, showError = true) => {
  if (!provinceCode) {
    domicileOptions.regencies = [];
    return;
  }
  domicileLoading.regencies = true;
  try {
    domicileOptions.regencies = await masterDataService.getIndonesiaRegencies(provinceCode, { limit: 600 });
  } catch (_error) {
    if (showError) appStore.pushToast('Gagal memuat daftar kabupaten/kota.', 'error');
  } finally {
    domicileLoading.regencies = false;
  }
};

const loadDomicileDistricts = async (regencyCode: string, showError = true) => {
  if (!regencyCode) {
    domicileOptions.districts = [];
    return;
  }
  domicileLoading.districts = true;
  try {
    domicileOptions.districts = await masterDataService.getIndonesiaDistricts(regencyCode, { limit: 800 });
  } catch (_error) {
    if (showError) appStore.pushToast('Gagal memuat daftar kecamatan.', 'error');
  } finally {
    domicileLoading.districts = false;
  }
};

const loadDomicileVillages = async (districtCode: string, showError = true) => {
  if (!districtCode) {
    domicileOptions.villages = [];
    return;
  }
  domicileLoading.villages = true;
  try {
    domicileOptions.villages = await masterDataService.getIndonesiaVillages(districtCode, { limit: 1000 });
  } catch (_error) {
    if (showError) appStore.pushToast('Gagal memuat daftar desa/kelurahan.', 'error');
  } finally {
    domicileLoading.villages = false;
  }
};

watch(
  () => form.villageId,
  () => {
    form.hamletId = '';
    form.rwId = '';
    form.rtId = '';
  },
);

watch(
  () => form.hamletId,
  () => {
    form.rwId = '';
    form.rtId = '';
  },
);

watch(
  () => form.rwId,
  () => {
    form.rtId = '';
  },
);

watch(
  () => form.domicileProvinceCode,
  async (value) => {
    if (hydratingDomicile.value) return;
    form.domicileRegencyCode = '';
    form.domicileDistrictCode = '';
    form.domicileVillageCode = '';
    domicileOptions.regencies = [];
    domicileOptions.districts = [];
    domicileOptions.villages = [];
    await loadDomicileRegencies(value, false);
  },
);

watch(
  () => form.domicileRegencyCode,
  async (value) => {
    if (hydratingDomicile.value) return;
    form.domicileDistrictCode = '';
    form.domicileVillageCode = '';
    domicileOptions.districts = [];
    domicileOptions.villages = [];
    await loadDomicileDistricts(value, false);
  },
);

watch(
  () => form.domicileDistrictCode,
  async (value) => {
    if (hydratingDomicile.value) return;
    form.domicileVillageCode = '';
    domicileOptions.villages = [];
    await loadDomicileVillages(value, false);
    ensureLocalServiceDefaults(true);
  },
);

watch(selectedDomicileVillageName, () => {
  if (hydratingDomicile.value) return;
  ensureLocalServiceDefaults(true);
});

const resetForm = () => {
  editingId.value = null;
  form.familyNumber = '';
  form.headName = '';
  form.address = '';
  form.phone = '';
  form.villageId = '';
  form.hamletId = '';
  form.rwId = '';
  form.rtId = '';
  form.domicileProvinceCode = '';
  form.domicileRegencyCode = '';
  form.domicileDistrictCode = '';
  form.domicileVillageCode = '';
  form.domicileRw = '';
  form.domicileRt = '';
  domicileOptions.regencies = [];
  domicileOptions.districts = [];
  domicileOptions.villages = [];
  ensureLocalServiceDefaults(false);
  form.members = createDefaultMembers(form.headName);
};

watch(
  () => form.headName,
  (value) => {
    const kepala = form.members.find((item) => String(item.relationType).toUpperCase() === 'KEPALA KELUARGA');
    if (!kepala) return;
    kepala.fullName = value;
  },
);

const load = async () => {
  loading.value = true;
  try {
    const response = await familiesService.list({
      search: filters.search || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    });
    items.value = response.data || [];
    meta.value = response.meta;
  } catch (_error) {
    appStore.pushToast('Gagal memuat master KK.', 'error');
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  filters.page = 1;
  await load();
};

const openCreate = () => {
  if (saving.value) return;
  resetForm();
  openForm.value = true;
};

const closeForm = () => {
  if (saving.value) return;
  openForm.value = false;
};

const applyKkTemplate = () => {
  form.members = createCompleteKkTemplate(form.headName);
};

const editItem = async (item: any) => {
  if (saving.value) return;
  editingId.value = item.id;
  form.familyNumber = item.familyNumber || '';
  form.headName = item.headName || '';
  form.address = item.address || '';
  form.phone = item.phone || '';
  form.villageId = item.villageId ? String(item.villageId) : '';
  form.hamletId = item.hamletId ? String(item.hamletId) : '';
  form.rwId = item.rwId ? String(item.rwId) : '';
  form.rtId = item.rtId ? String(item.rtId) : '';
  form.domicileProvinceCode = item.domicileProvinceCode || '';
  form.domicileRegencyCode = item.domicileRegencyCode || '';
  form.domicileDistrictCode = item.domicileDistrictCode || '';
  form.domicileVillageCode = item.domicileVillageCode || '';
  form.domicileRw = item.domicileRw || '';
  form.domicileRt = item.domicileRt || '';
  hydratingDomicile.value = true;
  try {
    if (!domicileOptions.provinces.length) {
      await loadDomicileProvinces(false);
    }
    await loadDomicileRegencies(form.domicileProvinceCode, false);
    await loadDomicileDistricts(form.domicileRegencyCode, false);
    await loadDomicileVillages(form.domicileDistrictCode, false);
  } finally {
    hydratingDomicile.value = false;
  }
  form.members = Array.isArray(item.members) && item.members.length
    ? item.members.map((member: any) => ({
        relationType: member.relationType || 'ANAK',
        fullName: member.fullName || '',
        nik: member.nik || '',
        gender: member.gender || 'MALE',
        placeOfBirth: member.placeOfBirth || '',
        birthDate: member.birthDate ? String(member.birthDate).slice(0, 10) : '',
        religion: member.religion || '',
        education: member.education || '',
        occupation: member.occupation || '',
        maritalStatus: member.maritalStatus || '',
        citizenship: member.citizenship || 'WNI',
        fatherName: member.fatherName || '',
        motherName: member.motherName || '',
        relationshipStatus: member.relationshipStatus || '',
      }))
    : createDefaultMembers(form.headName);
  openForm.value = true;
};

const save = async () => {
  if (saving.value) return;

  if (!form.familyNumber || !form.headName || !form.address) {
    appStore.pushToast('Lengkapi Identitas KK: No KK, nama kepala keluarga, dan alamat lengkap.', 'error');
    return;
  }
  const normalizedFamilyNumber = digitsOnly(form.familyNumber);
  if (normalizedFamilyNumber.length < 8) {
    appStore.pushToast('No KK terlalu pendek. Pastikan mengisi nomor KK sesuai dokumen keluarga.', 'error');
    return;
  }
  if (
    !form.domicileProvinceCode ||
    !form.domicileRegencyCode ||
    !form.domicileDistrictCode ||
    !form.domicileVillageCode
  ) {
    appStore.pushToast('Lengkapi Wilayah Domisili Indonesia: provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan.', 'error');
    return;
  }
  if (!form.members.some((member) => member.fullName.trim())) {
    appStore.pushToast('Tambahkan minimal 1 anggota keluarga.', 'error');
    return;
  }

  const submittedNiks = form.members
    .map((member) => ({ name: member.fullName.trim(), nik: digitsOnly(member.nik) }))
    .filter((member) => member.name && member.nik);
  const seenNiks = new Set<string>();
  const duplicatedNik = submittedNiks.find((member) => {
    if (seenNiks.has(member.nik)) return true;
    seenNiks.add(member.nik);
    return false;
  });
  if (duplicatedNik) {
    appStore.pushToast(`NIK anggota keluarga tidak boleh sama: ****${duplicatedNik.nik.slice(-4)}.`, 'error');
    return;
  }

  ensureLocalServiceDefaults(true);
  if (!form.villageId || !form.hamletId || !form.rwId || !form.rtId) {
    appStore.pushToast('Lengkapi Wilayah Layanan Posyandu. Jika Dusun/RW/RT kosong, buka Pengaturan lalu buat data wilayah lokal terlebih dahulu.', 'error');
    return;
  }

  const domicileProvinceName = getRegionNameByCode(domicileOptions.provinces, form.domicileProvinceCode);
  const domicileRegencyName = getRegionNameByCode(domicileOptions.regencies, form.domicileRegencyCode);
  const domicileDistrictName = getRegionNameByCode(domicileOptions.districts, form.domicileDistrictCode);
  const domicileVillageName = getRegionNameByCode(domicileOptions.villages, form.domicileVillageCode);

  const payload = {
    familyNumber: normalizedFamilyNumber,
    headName: form.headName.trim(),
    address: form.address.trim(),
    phone: form.phone.trim() || null,
    villageId: Number(form.villageId),
    hamletId: Number(form.hamletId),
    rwId: Number(form.rwId),
    rtId: Number(form.rtId),
    domicileProvinceCode: form.domicileProvinceCode,
    domicileProvinceName,
    domicileRegencyCode: form.domicileRegencyCode,
    domicileRegencyName,
    domicileDistrictCode: form.domicileDistrictCode,
    domicileDistrictName,
    domicileVillageCode: form.domicileVillageCode,
    domicileVillageName,
    domicileRw: form.domicileRw.trim() || null,
    domicileRt: form.domicileRt.trim() || null,
    members: form.members
      .filter((member) => member.fullName.trim())
      .map((member) => ({
        relationType: member.relationType,
        fullName: member.fullName.trim(),
        nik: digitsOnly(member.nik) || null,
        gender: member.gender,
        placeOfBirth: member.placeOfBirth.trim() || null,
        birthDate: member.birthDate || null,
        religion: member.religion.trim() || null,
        education: member.education.trim() || null,
        occupation: member.occupation.trim() || null,
        maritalStatus: member.maritalStatus.trim() || null,
        citizenship: member.citizenship.trim() || null,
        fatherName: member.fatherName.trim() || null,
        motherName: member.motherName.trim() || null,
        relationshipStatus: member.relationshipStatus.trim() || null,
      })),
  };

  try {
    saving.value = true;
    if (editingId.value) {
      await familiesService.update(editingId.value, payload);
    } else {
      await familiesService.create(payload);
    }
    await masterDataStore.fetchAll(true);
    appStore.pushToast('Master KK berhasil disimpan. Jika lanjut input balita, pilih KK ini di halaman Data Balita.', 'success');
    openForm.value = false;
    resetForm();
    await load();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menyimpan master KK.'), 'error');
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  if (!confirmDeleteId.value) return;
  try {
    await familiesService.remove(confirmDeleteId.value);
    await masterDataStore.fetchAll(true);
    appStore.pushToast('Master KK berhasil dihapus.', 'success');
    confirmDeleteId.value = null;
    await load();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menghapus master KK.'), 'error');
  }
};

onMounted(async () => {
  await masterDataStore.fetchAll();
  await loadDomicileProvinces(false);
  await load();
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Master Kartu Keluarga (KK)</h2>
        <p class="muted-text" style="margin: 6px 0 0">Data utama keluarga. Ibu/Ayah dan Balita mengacu ke master KK ini.</p>
      </div>
      <AppButton @click="openCreate">Tambah KK</AppButton>
    </div>

    <AppCard>
      <div class="toolbar-row filters-grid">
        <AppInput v-model="filters.search" label="Cari No KK / Kepala Keluarga / Alamat" />
        <AppButton @click="applyFilters">Terapkan filter</AppButton>
      </div>
    </AppCard>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat master KK..." />
    </AppCard>
    <AppCard v-else-if="!items.length">
      <EmptyState>
        <template #title>Belum ada data KK</template>
        Tambahkan master KK terlebih dahulu sebelum input data balita.
      </EmptyState>
    </AppCard>
    <AppCard v-else>
      <DataTable
        :columns="[
          { key: 'kk', label: 'No KK' },
          { key: 'kepala', label: 'Kepala Keluarga' },
          { key: 'wilayah', label: 'Wilayah' },
          { key: 'ringkas', label: 'Ringkasan' },
          { key: 'aksi', label: 'Aksi' },
        ]"
        :rows="items"
      >
        <template #kk="{ row }">
          <div>
            <strong>{{ row.familyNumber }}</strong>
            <small class="muted-text">{{ row.phone || '-' }}</small>
          </div>
        </template>
        <template #kepala="{ row }">
          <div>{{ row.headName }}</div>
          <small class="muted-text">{{ row.address }}</small>
        </template>
        <template #wilayah="{ row }">
          <div>{{ row.domicileVillageName || '-' }} • {{ row.domicileDistrictName || '-' }} • {{ row.domicileRegencyName || '-' }}</div>
          <small class="muted-text">
            RW {{ row.domicileRw || '-' }} • RT {{ row.domicileRt || '-' }}
          </small>
        </template>
        <template #ringkas="{ row }">
          <small class="muted-text">Anggota: {{ row.memberCount || 0 }} • Anak di KK: {{ childCount(row) }} • Balita tercatat: {{ row.toddlerCount }}</small>
        </template>
        <template #aksi="{ row }">
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="editItem(row)">Edit</button>
            <button class="ghost-button" type="button" @click="confirmDeleteId = row.id">Hapus</button>
          </div>
        </template>
      </DataTable>

      <div class="toolbar-row table-footer-row" style="margin-top: 12px">
        <small class="muted-text">Total: {{ meta?.total || 0 }} KK</small>
        <div class="inline-actions">
          <AppButton variant="secondary" :disabled="filters.page <= 1" @click="filters.page -= 1; load()">Sebelumnya</AppButton>
          <AppButton variant="secondary" :disabled="filters.page >= (meta?.totalPages || 1)" @click="filters.page += 1; load()">
            Berikutnya
          </AppButton>
        </div>
      </div>
    </AppCard>

    <AppDialog :open="openForm" :title="editingId ? 'Edit Master KK' : 'Tambah Master KK'" @close="closeForm">
      <form class="form-grid kk-dialog-form" @submit.prevent="save">
        <AppInfoNote title="Yang perlu disiapkan sebelum simpan KK">
          Lengkapi identitas KK, domisili nasional, wilayah layanan posyandu lokal, dan minimal 1 anggota keluarga. Data RT/RW lokal hanya bisa dipilih dari menu Pengaturan.
        </AppInfoNote>
        <div class="kk-meta-grid">
          <div class="card-panel kk-meta-card">
            <h3 class="kk-section-title">Identitas KK</h3>
            <div class="kk-fields-grid">
              <AppInput v-model="form.familyNumber" label="No KK" required inputmode="numeric" hint="Isi sesuai dokumen KK." />
              <AppInput v-model="form.headName" label="Nama Kepala Keluarga" required />
              <AppInput v-model="form.phone" label="No HP Keluarga" inputmode="tel" hint="Dipakai untuk menghubungi orang tua/wali." />
              <AppInput v-model="form.address" label="Alamat Lengkap" required />
            </div>
          </div>

          <div class="card-panel kk-meta-card">
            <h3 class="kk-section-title">Wilayah Domisili (Indonesia)</h3>
            <div class="kk-fields-grid">
              <AppSelect v-model="form.domicileProvinceCode" label="Provinsi" required :options="domicileProvinceOptions" empty-hint="Daftar provinsi belum termuat. Cek koneksi lalu buka ulang form." />
              <AppSelect
                v-model="form.domicileRegencyCode"
                label="Kabupaten / Kota"
                required
                :options="domicileRegencyOptions"
                :disabled="!form.domicileProvinceCode"
                empty-hint="Pilih provinsi terlebih dahulu."
              />
              <AppSelect
                v-model="form.domicileDistrictCode"
                label="Kecamatan"
                required
                :options="domicileDistrictOptions"
                :disabled="!form.domicileRegencyCode"
                empty-hint="Pilih kabupaten/kota terlebih dahulu."
              />
              <AppSelect
                v-model="form.domicileVillageCode"
                label="Desa / Kelurahan"
                required
                :options="domicileVillageOptions"
                :disabled="!form.domicileDistrictCode"
                empty-hint="Pilih kecamatan terlebih dahulu."
              />
              <AppInput v-model="form.domicileRw" label="RW (Domisili)" />
              <AppInput v-model="form.domicileRt" label="RT (Domisili)" />
            </div>
            <small class="muted-text">
              {{
                domicileLoading.provinces || domicileLoading.regencies || domicileLoading.districts || domicileLoading.villages
                  ? 'Memuat referensi wilayah Indonesia...'
                  : 'Referensi wilayah nasional berdasarkan pilihan provinsi → kabupaten/kota → kecamatan.'
              }}
            </small>
          </div>

          <div class="card-panel kk-meta-card kk-meta-card--full">
            <h3 class="kk-section-title">Wilayah Layanan Posyandu (Lokal)</h3>
            <div class="setup-checklist" :data-has-warning="hasMissingServiceData">
              <div class="setup-checklist-head">
                <div>
                  <strong>Status data wilayah lokal</strong>
                  <small>Jika ada yang kosong, lengkapi dari menu Pengaturan terlebih dahulu.</small>
                </div>
                <RouterLink to="/pengaturan" class="app-button" data-variant="secondary">Buka Pengaturan</RouterLink>
              </div>
              <div class="setup-checklist-grid">
                <div v-for="item in serviceReadinessItems" :key="item.label" class="setup-checklist-item" :data-status="item.status">
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.text }}</small>
                </div>
              </div>
            </div>
            <div class="kk-fields-grid">
              <AppSelect
                v-model="form.villageId"
                label="Desa (Layanan)"
                required
                :options="localVillageOptions"
                :disabled="Boolean(actorVillageId)"
              />
              <AppSelect
                v-model="form.hamletId"
                label="Dusun"
                required
                :options="localHamletOptions"
                :disabled="!form.villageId"
                empty-hint="Dusun belum tersedia. Tambahkan dulu di Pengaturan Wilayah & Posyandu."
              />
              <AppSelect
                v-model="form.rwId"
                label="RW"
                required
                :options="localRwOptions"
                :disabled="!form.hamletId"
                empty-hint="Pilih dusun dulu atau tambahkan RW pada dusun tersebut di Pengaturan."
              />
              <AppSelect
                v-model="form.rtId"
                label="RT"
                required
                :options="localRtOptions"
                :disabled="!form.rwId"
                empty-hint="Pilih RW dulu atau tambahkan RT pada RW tersebut di Pengaturan."
              />
            </div>
            <small class="muted-text">
              RT/RW hanya bisa dipilih dari data Pengaturan Wilayah & Posyandu dan otomatis dibatasi sesuai desa akun.
            </small>
          </div>
        </div>

        <div class="card-panel kk-members-card">
          <div class="section-head">
            <div>
              <strong>Anggota Keluarga (Format KK)</strong>
              <p class="muted-text" style="margin: 4px 0 0">Minimal 1 anggota (kepala keluarga). Istri/anak opsional sesuai kondisi KK.</p>
            </div>
            <div class="inline-actions kk-member-actions">
              <AppButton type="button" variant="secondary" :disabled="saving" @click="applyKkTemplate">Template KK Lengkap</AppButton>
              <AppButton type="button" variant="secondary" :disabled="saving" @click="addMember('ISTRI', 'FEMALE')">Tambah Istri</AppButton>
              <AppButton type="button" variant="secondary" :disabled="saving" @click="addMember('ANAK', 'MALE')">Tambah Anak</AppButton>
              <AppButton type="button" variant="secondary" :disabled="saving" @click="addMember('ANAK', 'FEMALE')">Tambah Anak (P)</AppButton>
              <AppButton type="button" variant="secondary" :disabled="saving" @click="addMember('LAINNYA', 'MALE')">Tambah Lainnya</AppButton>
            </div>
          </div>

          <div class="kk-members-list">
            <div v-for="(member, index) in form.members" :key="`member-${index}`" class="kk-member-row">
              <div class="kk-member-row-head">
                <strong>Anggota {{ index + 1 }}</strong>
                <button class="ghost-button" type="button" :disabled="saving" @click="removeMember(index)">Hapus</button>
              </div>
              <div class="kk-member-grid">
                <label class="form-field">
                  <span>Hubungan</span>
                  <select v-model="member.relationType" class="form-input">
                    <option v-for="type in relationTypeOptions" :key="type" :value="type">{{ type }}</option>
                  </select>
                </label>
                <label class="form-field">
                  <span>Nama lengkap</span>
                  <input v-model="member.fullName" class="form-input" placeholder="Nama lengkap" />
                </label>
                <label class="form-field">
                  <span>NIK</span>
                  <input v-model="member.nik" class="form-input" placeholder="NIK" />
                </label>
                <label class="form-field">
                  <span>Jenis kelamin</span>
                  <select v-model="member.gender" class="form-input">
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </label>
                <label class="form-field">
                  <span>Tempat lahir</span>
                  <input v-model="member.placeOfBirth" class="form-input" placeholder="Tempat lahir" />
                </label>
                <label class="form-field">
                  <span>Tanggal lahir</span>
                  <input v-model="member.birthDate" type="date" class="form-input" />
                </label>
                <label class="form-field">
                  <span>Agama</span>
                  <input v-model="member.religion" class="form-input" placeholder="Agama" />
                </label>
                <label class="form-field">
                  <span>Pendidikan</span>
                  <input v-model="member.education" class="form-input" placeholder="Pendidikan" />
                </label>
                <label class="form-field">
                  <span>Pekerjaan</span>
                  <input v-model="member.occupation" class="form-input" placeholder="Pekerjaan" />
                </label>
                <label class="form-field">
                  <span>Status kawin</span>
                  <input v-model="member.maritalStatus" class="form-input" placeholder="Status kawin" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="inline-actions kk-form-actions">
          <AppButton type="submit" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan' }}</AppButton>
          <AppButton type="button" variant="secondary" :disabled="saving" @click="closeForm">Batal</AppButton>
        </div>
      </form>
    </AppDialog>

    <AppDialog :open="Boolean(confirmDeleteId)" title="Hapus master KK?" @close="confirmDeleteId = null">
      <p class="muted-text">KK hanya bisa dihapus jika tidak dipakai data balita.</p>
      <div class="inline-actions">
        <AppButton variant="danger" @click="remove">Ya, hapus</AppButton>
        <AppButton variant="secondary" @click="confirmDeleteId = null">Batal</AppButton>
      </div>
    </AppDialog>
  </div>
</template>

<style scoped>
:deep(.dialog-panel) {
  width: min(1280px, 96vw);
  padding: 16px 18px;
}

.kk-dialog-form {
  gap: 12px;
}

.kk-meta-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  align-items: start;
}

.kk-meta-card {
  box-shadow: none;
  border: 1px solid #dce8e2;
  min-width: 0;
  align-self: start;
}

.kk-meta-card--full {
  grid-column: 1 / -1;
}

.kk-section-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.kk-fields-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
}

.kk-fields-grid :deep(.form-field) {
  min-width: 0;
}

.kk-fields-grid :deep(.form-input) {
  min-width: 0;
}

.kk-members-card {
  box-shadow: none;
  border: 1px solid #dce8e2;
}

.kk-member-actions {
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.kk-member-actions > * {
  width: 100%;
}

.kk-members-list {
  display: grid;
  gap: 10px;
  margin-top: 8px;
}

.kk-member-row {
  border: 1px solid #e1ece6;
  border-radius: 12px;
  padding: 10px;
  background: #fcfefd;
}

.kk-member-row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.kk-member-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
}

.kk-member-grid .form-field {
  margin: 0;
  min-width: 0;
}

.kk-member-grid .form-input {
  min-width: 0;
}

.kk-form-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, #ffffff 40%);
  padding-top: 8px;
}

@media (min-width: 980px) {
  .kk-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kk-member-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 700px) and (max-width: 1024px) {
  :deep(.dialog-panel) {
    width: min(1220px, 98vw);
    padding: 14px 14px;
  }

  .kk-fields-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kk-member-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  :deep(.dialog-panel) {
    width: min(100%, 720px);
  }

  .kk-fields-grid {
    grid-template-columns: 1fr;
  }

  .kk-member-grid {
    grid-template-columns: 1fr;
  }
}
</style>
