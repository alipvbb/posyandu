<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';
import { familiesService } from '../services/families.service';
import { masterDataService } from '../services/master-data.service';
import { useAppStore } from '../stores/app';
import { useMasterDataStore } from '../stores/master-data';

const appStore = useAppStore();
const masterDataStore = useMasterDataStore();

const extractApiErrorMessage = (error: any, fallback: string) => {
  const details = error?.response?.data?.details;
  const fieldErrors = details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstField = Object.keys(fieldErrors)[0];
    const firstMessages = firstField ? fieldErrors[firstField] : null;
    if (Array.isArray(firstMessages) && firstMessages.length) {
      return `${firstField}: ${firstMessages[0]}`;
    }
  }
  return error?.response?.data?.message || fallback;
};

const loading = ref(true);
const items = ref<any[]>([]);
const meta = ref<any>(null);
const openForm = ref(false);
const editingId = ref<number | null>(null);
const confirmDeleteId = ref<number | null>(null);
const hydratingDomicile = ref(false);

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

const hamletOptions = computed(() =>
  masterDataStore.hamlets
    .filter((item: any) => !form.villageId || Number(form.villageId) === item.villageId)
    .map((item: any) => ({ label: item.name, value: String(item.id) })),
);

const rwOptions = computed(() =>
  masterDataStore.rws
    .filter((item: any) => !form.hamletId || Number(form.hamletId) === item.hamletId)
    .map((item: any) => ({ label: item.name, value: String(item.id) })),
);

const rtOptions = computed(() =>
  masterDataStore.rts
    .filter((item: any) => !form.rwId || Number(form.rwId) === item.rwId)
    .map((item: any) => ({ label: item.name, value: String(item.id) })),
);

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
  },
);

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
  domicileOptions.regencies = [];
  domicileOptions.districts = [];
  domicileOptions.villages = [];
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
  resetForm();
  openForm.value = true;
};

const applyKkTemplate = () => {
  form.members = createCompleteKkTemplate(form.headName);
};

const editItem = async (item: any) => {
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
  if (!form.familyNumber || !form.headName || !form.address || !form.villageId || !form.hamletId || !form.rwId || !form.rtId) {
    appStore.pushToast('Lengkapi No KK, kepala keluarga, alamat, dan wilayah layanan posyandu.', 'error');
    return;
  }
  if (
    !form.domicileProvinceCode ||
    !form.domicileRegencyCode ||
    !form.domicileDistrictCode ||
    !form.domicileVillageCode
  ) {
    appStore.pushToast('Lengkapi wilayah domisili nasional: provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan.', 'error');
    return;
  }
  if (!form.members.some((member) => member.fullName.trim())) {
    appStore.pushToast('Tambahkan minimal 1 anggota keluarga.', 'error');
    return;
  }

  const domicileProvinceName = getRegionNameByCode(domicileOptions.provinces, form.domicileProvinceCode);
  const domicileRegencyName = getRegionNameByCode(domicileOptions.regencies, form.domicileRegencyCode);
  const domicileDistrictName = getRegionNameByCode(domicileOptions.districts, form.domicileDistrictCode);
  const domicileVillageName = getRegionNameByCode(domicileOptions.villages, form.domicileVillageCode);

  const payload = {
    familyNumber: form.familyNumber,
    headName: form.headName,
    address: form.address,
    phone: form.phone || null,
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
    members: form.members
      .filter((member) => member.fullName.trim())
      .map((member) => ({
        relationType: member.relationType,
        fullName: member.fullName,
        nik: member.nik || null,
        gender: member.gender,
        placeOfBirth: member.placeOfBirth || null,
        birthDate: member.birthDate || null,
        religion: member.religion || null,
        education: member.education || null,
        occupation: member.occupation || null,
        maritalStatus: member.maritalStatus || null,
        citizenship: member.citizenship || null,
        fatherName: member.fatherName || null,
        motherName: member.motherName || null,
        relationshipStatus: member.relationshipStatus || null,
      })),
  };

  try {
    if (editingId.value) {
      await familiesService.update(editingId.value, payload);
    } else {
      await familiesService.create(payload);
    }
    await masterDataStore.fetchAll(true);
    appStore.pushToast('Master KK berhasil disimpan.', 'success');
    openForm.value = false;
    resetForm();
    await load();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menyimpan master KK.'), 'error');
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
          <div>{{ row.hamlet?.name || '-' }} • {{ row.rw?.name || '-' }} • {{ row.rt?.name || '-' }}</div>
          <small class="muted-text">
            {{ row.domicileVillageName || '-' }} • {{ row.domicileDistrictName || '-' }} • {{ row.domicileRegencyName || '-' }}
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

    <AppDialog :open="openForm" :title="editingId ? 'Edit Master KK' : 'Tambah Master KK'" @close="openForm = false">
      <form class="form-grid kk-dialog-form" @submit.prevent="save">
        <div class="kk-meta-grid">
          <div class="card-panel kk-meta-card">
            <h3 class="kk-section-title">Identitas KK</h3>
            <div class="kk-fields-grid">
              <AppInput v-model="form.familyNumber" label="No KK" />
              <AppInput v-model="form.headName" label="Nama Kepala Keluarga" />
              <AppInput v-model="form.phone" label="No HP Keluarga" />
              <AppInput v-model="form.address" label="Alamat Lengkap" />
            </div>
          </div>

          <div class="card-panel kk-meta-card">
            <h3 class="kk-section-title">Wilayah Domisili (Indonesia)</h3>
            <div class="kk-fields-grid">
              <AppSelect v-model="form.domicileProvinceCode" label="Provinsi" :options="domicileProvinceOptions" />
              <AppSelect
                v-model="form.domicileRegencyCode"
                label="Kabupaten / Kota"
                :options="domicileRegencyOptions"
                :disabled="!form.domicileProvinceCode"
              />
              <AppSelect
                v-model="form.domicileDistrictCode"
                label="Kecamatan"
                :options="domicileDistrictOptions"
                :disabled="!form.domicileRegencyCode"
              />
              <AppSelect
                v-model="form.domicileVillageCode"
                label="Desa / Kelurahan"
                :options="domicileVillageOptions"
                :disabled="!form.domicileDistrictCode"
              />
            </div>
            <small class="muted-text">
              {{
                domicileLoading.provinces || domicileLoading.regencies || domicileLoading.districts || domicileLoading.villages
                  ? 'Memuat referensi wilayah Indonesia...'
                  : 'Referensi wilayah nasional berdasarkan pilihan provinsi → kabupaten/kota → kecamatan.'
              }}
            </small>
          </div>

          <div class="card-panel kk-meta-card">
            <h3 class="kk-section-title">Wilayah Layanan Posyandu (Lokal)</h3>
            <div class="kk-fields-grid">
              <AppSelect
                v-model="form.villageId"
                label="Desa"
                :options="masterDataStore.villages.map((item: any) => ({ label: item.name, value: String(item.id) }))"
              />
              <AppSelect v-model="form.hamletId" label="Dusun" :options="hamletOptions" />
              <AppSelect v-model="form.rwId" label="RW" :options="rwOptions" />
              <AppSelect v-model="form.rtId" label="RT" :options="rtOptions" />
            </div>
          </div>
        </div>

        <div class="card-panel kk-members-card">
          <div class="section-head">
            <div>
              <strong>Anggota Keluarga (Format KK)</strong>
              <p class="muted-text" style="margin: 4px 0 0">Minimal 1 anggota (kepala keluarga). Istri/anak opsional sesuai kondisi KK.</p>
            </div>
            <div class="inline-actions kk-member-actions">
              <AppButton type="button" variant="secondary" @click="applyKkTemplate">Template KK Lengkap</AppButton>
              <AppButton type="button" variant="secondary" @click="addMember('ISTRI', 'FEMALE')">Tambah Istri</AppButton>
              <AppButton type="button" variant="secondary" @click="addMember('ANAK', 'MALE')">Tambah Anak</AppButton>
              <AppButton type="button" variant="secondary" @click="addMember('ANAK', 'FEMALE')">Tambah Anak (P)</AppButton>
              <AppButton type="button" variant="secondary" @click="addMember('LAINNYA', 'MALE')">Tambah Lainnya</AppButton>
            </div>
          </div>

          <div class="kk-members-list">
            <div v-for="(member, index) in form.members" :key="`member-${index}`" class="kk-member-row">
              <div class="kk-member-row-head">
                <strong>Anggota {{ index + 1 }}</strong>
                <button class="ghost-button" type="button" @click="removeMember(index)">Hapus</button>
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
          <AppButton type="submit">Simpan</AppButton>
          <AppButton type="button" variant="secondary" @click="openForm = false">Batal</AppButton>
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
  width: min(1240px, 96vw);
  padding: 16px 18px;
}

.kk-dialog-form {
  gap: 12px;
}

.kk-meta-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}

.kk-meta-card {
  box-shadow: none;
  border: 1px solid #dce8e2;
}

.kk-section-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.kk-fields-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
}

.kk-member-grid .form-field {
  margin: 0;
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

@media (min-width: 1280px) {
  .kk-meta-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .kk-member-grid {
    grid-template-columns: 1fr;
  }
}
</style>
