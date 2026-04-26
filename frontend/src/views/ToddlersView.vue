<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AppBadge from '../components/ui/AppBadge.vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { useMasterDataStore } from '../stores/master-data';
import { formatDate, riskLabel } from '../utils/format';

const appStore = useAppStore();
const authStore = useAuthStore();
const masterDataStore = useMasterDataStore();
const items = ref<any[]>([]);
const meta = ref<any>(null);
const loading = ref(true);
const confirmDeleteId = ref<number | null>(null);
type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'blue';
const filters = reactive({
  search: '',
  hamletId: '',
  posyanduId: '',
  riskLevel: '',
  page: 1,
});
const canCreateToddler = computed(() => authStore.hasPermission('toddlers.create'));
const canDeleteToddler = computed(() => authStore.hasPermission('toddlers.delete'));
const canCreateCheckup = computed(() => authStore.hasPermission('checkups.create'));
const filteredPosyandus = computed(() =>
  masterDataStore.posyandus.filter((item: any) =>
    filters.hamletId ? String(item.hamletId) === String(filters.hamletId) : true,
  ),
);

const riskTone = (value?: string): BadgeTone =>
  ({
    NORMAL: 'green',
    ATTENTION: 'yellow',
    STUNTING_RISK: 'red',
    UNDERNUTRITION: 'orange',
    OVERWEIGHT: 'blue',
  }[value || ''] as BadgeTone) || 'blue';

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await toddlersService.list({
      ...filters,
      hamletId: filters.hamletId || undefined,
      posyanduId: filters.posyanduId || undefined,
      riskLevel: filters.riskLevel || undefined,
    });
    items.value = response.data;
    meta.value = response.meta;
  } catch (_error) {
    appStore.pushToast('Gagal memuat data balita.', 'error');
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  filters.page = 1;
  await fetchData();
};

watch(
  () => filters.hamletId,
  (next) => {
    if (!filters.posyanduId) return;
    const stillValid = masterDataStore.posyandus.some(
      (item: any) =>
        String(item.id) === String(filters.posyanduId) &&
        String(item.hamletId) === String(next),
    );
    if (!stillValid) {
      filters.posyanduId = '';
    }
  },
);

const remove = async () => {
  if (!confirmDeleteId.value) return;
  try {
    await toddlersService.remove(confirmDeleteId.value);
    appStore.pushToast('Balita berhasil dihapus.', 'success');
    confirmDeleteId.value = null;
    await fetchData();
  } catch (_error) {
    appStore.pushToast('Gagal menghapus balita.', 'error');
  }
};

onMounted(async () => {
  await masterDataStore.fetchAll();
  await fetchData();
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Data Balita</h2>
        <p class="muted-text" style="margin: 6px 0 0">Pencarian cepat, filter risiko, dan akses pemeriksaan per balita.</p>
      </div>
      <RouterLink v-if="canCreateToddler" to="/balita/tambah" class="app-button">Tambah balita</RouterLink>
    </div>

    <AppCard>
      <div class="toolbar-row filters-grid">
        <AppInput v-model="filters.search" label="Cari nama / kode / orang tua" />
        <AppSelect
          v-model="filters.hamletId"
          label="Dusun"
          :options="masterDataStore.hamlets.map((item) => ({ label: item.name, value: item.id }))"
        />
        <AppSelect
          v-model="filters.posyanduId"
          label="Posyandu"
          :disabled="!filters.hamletId"
          :options="filteredPosyandus.map((item) => ({ label: item.name, value: item.id }))"
        />
        <AppSelect
          v-model="filters.riskLevel"
          label="Risiko"
          :options="[
            { label: 'Normal', value: 'NORMAL' },
            { label: 'Perlu perhatian', value: 'ATTENTION' },
            { label: 'Risiko stunting', value: 'STUNTING_RISK' },
            { label: 'Gizi kurang', value: 'UNDERNUTRITION' },
            { label: 'Kelebihan berat badan', value: 'OVERWEIGHT' },
          ]"
        />
        <AppButton @click="applyFilters">Terapkan filter</AppButton>
      </div>
    </AppCard>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat data balita..." />
    </AppCard>
    <AppCard v-else-if="!items.length">
      <EmptyState>
        <template #title>Tidak ada data balita</template>
        Coba ubah kata kunci atau filter yang dipakai.
      </EmptyState>
    </AppCard>
    <AppCard v-else>
      <DataTable
        :columns="[
          { key: 'balita', label: 'Balita' },
          { key: 'wilayah', label: 'Wilayah' },
          { key: 'pemeriksaan', label: 'Pemeriksaan terakhir' },
          { key: 'status', label: 'Status' },
          { key: 'aksi', label: 'Aksi' },
        ]"
        :rows="items"
      >
        <template #balita="{ row }">
          <div>
            <strong>{{ row.nama_lengkap }}</strong>
            <div class="muted-text">{{ row.kode_balita }} • {{ row.nama_ibu }}</div>
          </div>
        </template>
        <template #wilayah="{ row }">
          <div>{{ row.hamlet?.name }}</div>
          <small class="muted-text">{{ row.posyandu?.name }}</small>
        </template>
        <template #pemeriksaan="{ row }">
          <div>{{ row.latestCheckup ? formatDate(row.latestCheckup.examDate) : 'Belum ada' }}</div>
          <small class="muted-text">{{ row.latestCheckup?.statusLabel || 'Belum diperiksa' }}</small>
        </template>
        <template #status="{ row }">
          <AppBadge :tone="riskTone(row.latestCheckup?.riskLevel)">
            {{ row.latestCheckup ? riskLabel(row.latestCheckup.riskLevel) : 'Belum ada data' }}
          </AppBadge>
        </template>
        <template #aksi="{ row }">
          <div class="inline-actions">
            <RouterLink :to="`/balita/${row.id}`" class="app-button table-detail-button">Detail</RouterLink>
            <RouterLink v-if="canCreateCheckup" :to="`/balita/${row.id}/pemeriksaan`" class="app-button table-detail-button">
              Pemeriksaan
            </RouterLink>
            <button v-if="canDeleteToddler" class="ghost-button" type="button" @click="confirmDeleteId = row.id">Hapus</button>
          </div>
        </template>
      </DataTable>

      <div class="toolbar-row table-footer-row" style="margin-top: 16px">
        <small class="muted-text">Total: {{ meta?.total }} balita</small>
        <div class="inline-actions">
          <AppButton variant="secondary" :disabled="filters.page <= 1" @click="filters.page -= 1; fetchData()">Sebelumnya</AppButton>
          <AppButton
            variant="secondary"
            :disabled="filters.page >= (meta?.totalPages || 1)"
            @click="filters.page += 1; fetchData()"
          >
            Berikutnya
          </AppButton>
        </div>
      </div>
    </AppCard>

    <AppDialog :open="Boolean(confirmDeleteId) && canDeleteToddler" title="Hapus data balita?" @close="confirmDeleteId = null">
      <p class="muted-text">Data balita beserta histori pemeriksaan akan dihapus dari sistem.</p>
      <div class="inline-actions">
        <AppButton variant="danger" @click="remove">Ya, hapus</AppButton>
        <AppButton variant="secondary" @click="confirmDeleteId = null">Batal</AppButton>
      </div>
    </AppDialog>
  </div>
</template>
