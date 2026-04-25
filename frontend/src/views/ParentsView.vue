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
import { parentsService } from '../services/parents.service';
import { useAppStore } from '../stores/app';
import { useMasterDataStore } from '../stores/master-data';
import { formatDate } from '../utils/format';

type ParentType = 'mother' | 'father';

const appStore = useAppStore();
const masterDataStore = useMasterDataStore();

const parentType = ref<ParentType>('mother');
const loading = ref(true);
const items = ref<any[]>([]);
const meta = ref<any>(null);
const openForm = ref(false);
const editingId = ref<number | null>(null);
const confirmDeleteId = ref<number | null>(null);

const filters = reactive({
  search: '',
  familyNumber: '',
  page: 1,
  pageSize: 10,
});

const form = reactive({
  familyNumber: '',
  fullName: '',
  nik: '',
  birthDate: '',
  education: '',
  occupation: '',
  phone: '',
});

const parentLabel = computed(() => (parentType.value === 'mother' ? 'Ibu' : 'Ayah'));
const parentLabelPlural = computed(() => (parentType.value === 'mother' ? 'Ibu' : 'Ayah'));
const familyOptions = computed(() =>
  masterDataStore.families.map((item: any) => ({
    label: `${item.familyNumber} • ${item.headName}`,
    value: String(item.familyNumber),
  })),
);

const resetForm = () => {
  editingId.value = null;
  form.familyNumber = '';
  form.fullName = '';
  form.nik = '';
  form.birthDate = '';
  form.education = '';
  form.occupation = '';
  form.phone = '';
};

const load = async () => {
  loading.value = true;
  try {
    const response = await parentsService.list(parentType.value, {
      search: filters.search || undefined,
      familyNumber: filters.familyNumber || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    });
    items.value = response.data || [];
    meta.value = response.meta;
  } catch (_error) {
    appStore.pushToast(`Gagal memuat master ${parentLabelPlural.value.toLowerCase()}.`, 'error');
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

const editItem = (item: any) => {
  editingId.value = item.id;
  form.familyNumber = String(item.family?.familyNumber || '');
  form.fullName = item.fullName || '';
  form.nik = item.nik || '';
  form.birthDate = item.birthDate ? String(item.birthDate).slice(0, 10) : '';
  form.education = item.education || '';
  form.occupation = item.occupation || '';
  form.phone = item.phone || '';
  openForm.value = true;
};

const save = async () => {
  if (!form.familyNumber) {
    appStore.pushToast('No KK wajib dipilih.', 'error');
    return;
  }
  const payload = {
    familyNumber: form.familyNumber,
    fullName: form.fullName,
    nik: form.nik || null,
    birthDate: form.birthDate || null,
    education: form.education || null,
    occupation: form.occupation || null,
    phone: form.phone || null,
  };
  try {
    if (editingId.value) {
      await parentsService.update(parentType.value, editingId.value, payload);
    } else {
      await parentsService.create(parentType.value, payload);
    }
    appStore.pushToast(`Data ${parentLabel.value.toLowerCase()} berhasil disimpan.`, 'success');
    openForm.value = false;
    resetForm();
    await load();
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal menyimpan data.', 'error');
  }
};

const remove = async () => {
  if (!confirmDeleteId.value) return;
  try {
    await parentsService.remove(parentType.value, confirmDeleteId.value);
    appStore.pushToast(`Data ${parentLabel.value.toLowerCase()} berhasil dihapus.`, 'success');
    confirmDeleteId.value = null;
    await load();
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal menghapus data.', 'error');
  }
};

watch(parentType, async () => {
  filters.page = 1;
  filters.search = '';
  filters.familyNumber = '';
  resetForm();
  await load();
});

onMounted(async () => {
  await masterDataStore.fetchAll();
  await load();
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Master Orang Tua</h2>
        <p class="muted-text" style="margin: 6px 0 0">Kelola data ibu/ayah per keluarga untuk melengkapi master data posyandu.</p>
      </div>
      <div class="inline-actions">
        <RouterLink to="/master-keluarga" class="app-button" data-variant="secondary">Kelola Master KK</RouterLink>
        <AppButton @click="openCreate">Tambah {{ parentLabel }}</AppButton>
      </div>
    </div>

    <AppCard>
      <div class="inline-actions">
        <AppButton :variant="parentType === 'mother' ? 'primary' : 'secondary'" @click="parentType = 'mother'">Data Ibu</AppButton>
        <AppButton :variant="parentType === 'father' ? 'primary' : 'secondary'" @click="parentType = 'father'">Data Ayah</AppButton>
      </div>
    </AppCard>

    <AppCard>
      <div class="toolbar-row filters-grid">
        <AppInput v-model="filters.search" :label="`Cari ${parentLabelPlural.toLowerCase()} (nama / NIK / no HP / no KK)`" />
        <AppSelect v-model="filters.familyNumber" label="No KK (Master KK)" :options="familyOptions" />
        <AppButton @click="applyFilters">Terapkan filter</AppButton>
      </div>
    </AppCard>

    <AppCard v-if="loading">
      <AppLoadingBlock :text="`Memuat master ${parentLabelPlural.toLowerCase()}...`" />
    </AppCard>

    <AppCard v-else-if="!items.length">
      <EmptyState>
        <template #title>Belum ada data {{ parentLabelPlural.toLowerCase() }}</template>
        Silakan tambah data baru atau ubah kata kunci pencarian.
      </EmptyState>
    </AppCard>

    <AppCard v-else>
      <DataTable
        :columns="[
          { key: 'nama', label: parentLabel },
          { key: 'keluarga', label: 'Master KK' },
          { key: 'kontak', label: 'Kontak' },
          { key: 'aksi', label: 'Aksi' },
        ]"
        :rows="items"
      >
        <template #nama="{ row }">
          <div>
            <strong>{{ row.fullName }}</strong>
            <small class="muted-text">NIK: {{ row.nik || '-' }} • TTL: {{ row.birthDate ? formatDate(row.birthDate) : '-' }}</small>
          </div>
        </template>
        <template #keluarga="{ row }">
          <div><strong>{{ row.family?.familyNumber || '-' }}</strong></div>
          <small class="muted-text">Kepala KK: {{ row.family?.headName || '-' }}</small>
        </template>
        <template #kontak="{ row }">
          <div>{{ row.phone || '-' }}</div>
          <small class="muted-text">{{ row.occupation || '-' }}</small>
        </template>
        <template #aksi="{ row }">
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="editItem(row)">Edit</button>
            <button class="ghost-button" type="button" @click="confirmDeleteId = row.id">Hapus</button>
          </div>
        </template>
      </DataTable>

      <div class="toolbar-row table-footer-row" style="margin-top: 12px">
        <small class="muted-text">Total: {{ meta?.total || 0 }} data</small>
        <div class="inline-actions">
          <AppButton variant="secondary" :disabled="filters.page <= 1" @click="filters.page -= 1; load()">Sebelumnya</AppButton>
          <AppButton variant="secondary" :disabled="filters.page >= (meta?.totalPages || 1)" @click="filters.page += 1; load()">
            Berikutnya
          </AppButton>
        </div>
      </div>
    </AppCard>

    <AppDialog :open="openForm" :title="editingId ? `Edit ${parentLabel}` : `Tambah ${parentLabel}`" @close="openForm = false">
      <form class="form-grid" @submit.prevent="save">
        <AppSelect v-model="form.familyNumber" label="No KK (Master Kartu Keluarga)" :options="familyOptions" />
        <AppInput v-model="form.fullName" :label="`Nama ${parentLabel}`" />
        <AppInput v-model="form.nik" label="NIK" />
        <AppInput v-model="form.birthDate" label="Tanggal lahir" type="date" />
        <AppInput v-model="form.education" label="Pendidikan" />
        <AppInput v-model="form.occupation" label="Pekerjaan" />
        <AppInput v-model="form.phone" label="No HP" />
        <div class="inline-actions">
          <AppButton type="submit">Simpan</AppButton>
          <AppButton variant="secondary" type="button" @click="openForm = false">Batal</AppButton>
        </div>
      </form>
    </AppDialog>

    <AppDialog :open="Boolean(confirmDeleteId)" :title="`Hapus data ${parentLabel.toLowerCase()}?`" @close="confirmDeleteId = null">
      <p class="muted-text">Data master orang tua ini akan dihapus permanen.</p>
      <div class="inline-actions">
        <AppButton variant="danger" @click="remove">Ya, hapus</AppButton>
        <AppButton variant="secondary" @click="confirmDeleteId = null">Batal</AppButton>
      </div>
    </AppDialog>
  </div>
</template>
