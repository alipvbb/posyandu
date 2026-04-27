<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AppBadge from '../components/ui/AppBadge.vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DashboardBarChart from '../components/charts/DashboardBarChart.vue';
import ReportLineChart from '../components/charts/ReportLineChart.vue';
import ReportPieChart from '../components/charts/ReportPieChart.vue';
import DataTable from '../components/DataTable.vue';
import SummaryCard from '../components/SummaryCard.vue';
import { api } from '../services/api';
import { reportsService } from '../services/reports.service';
import { useAppStore } from '../stores/app';
import { useMasterDataStore } from '../stores/master-data';
import { formatDate, riskLabel } from '../utils/format';

const appStore = useAppStore();
const masterDataStore = useMasterDataStore();
const rows = ref<any[]>([]);
const insights = ref<any>(null);
const loading = ref(true);
const previewPage = ref(1);
const priorityPage = ref(1);
const previewPageSize = 8;
const priorityPageSize = 8;

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const defaultEndDate = new Date();
const defaultStartDate = new Date(defaultEndDate);
defaultStartDate.setMonth(defaultStartDate.getMonth() - 11);
defaultStartDate.setDate(1);

const period = reactive({
  startDate: toIsoDate(defaultStartDate),
  endDate: toIsoDate(defaultEndDate),
  hamletId: '',
  rwId: '',
  rtId: '',
});

const rwOptions = computed(() =>
  masterDataStore.rws
    .filter((item: any) => (period.hamletId ? String(item.hamletId) === String(period.hamletId) : true))
    .map((item: any) => ({ label: item.name, value: item.id })),
);

const rtOptions = computed(() =>
  masterDataStore.rts
    .filter((item: any) => (period.rwId ? String(item.rwId) === String(period.rwId) : true))
    .map((item: any) => ({ label: item.name, value: item.id })),
);

watch(
  () => period.hamletId,
  () => {
    if (period.rwId) {
      const hasRw = rwOptions.value.some((item) => String(item.value) === String(period.rwId));
      if (!hasRw) period.rwId = '';
    }
    if (period.rtId) {
      const hasRt = rtOptions.value.some((item) => String(item.value) === String(period.rtId));
      if (!hasRt) period.rtId = '';
    }
  },
);

watch(
  () => period.rwId,
  () => {
    if (!period.rtId) return;
    const hasRt = rtOptions.value.some((item) => String(item.value) === String(period.rtId));
    if (!hasRt) period.rtId = '';
  },
);

const periodParams = computed(() => ({
  startDate: period.startDate,
  endDate: period.endDate,
  ...(period.hamletId ? { hamletId: period.hamletId } : {}),
  ...(period.rwId ? { rwId: period.rwId } : {}),
  ...(period.rtId ? { rtId: period.rtId } : {}),
}));

const periodLabel = computed(() => {
  const start = period.startDate ? formatDate(period.startDate) : '-';
  const end = period.endDate ? formatDate(period.endDate) : '-';
  return `${start} s/d ${end}`;
});

const load = async () => {
  if (period.startDate && period.endDate && period.startDate > period.endDate) {
    appStore.pushToast('Tanggal mulai tidak boleh melebihi tanggal akhir.', 'error');
    return;
  }

  loading.value = true;
  try {
    const [toddlers, insightData] = await Promise.all([
      reportsService.getToddlers(periodParams.value),
      reportsService.getInsights(periodParams.value),
    ]);
    rows.value = toddlers;
    insights.value = insightData;
    previewPage.value = 1;
    priorityPage.value = 1;
  } catch (_error) {
    appStore.pushToast('Gagal memuat data laporan.', 'error');
  } finally {
    loading.value = false;
  }
};

const exportReport = async (type: 'toddlers' | 'checkups' | 'risk', format: 'csv' | 'xlsx' | 'pdf') => {
  try {
    const response = await api.get(`/reports/${type}`, {
      params: { format, ...periodParams.value },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (_error) {
    appStore.pushToast('Gagal export laporan.', 'error');
  }
};

const riskTone = (value?: string) =>
  ({
    NORMAL: 'green',
    ATTENTION: 'yellow',
    STUNTING_RISK: 'red',
    UNDERNUTRITION: 'orange',
    OVERWEIGHT: 'blue',
  }[value || ''] as 'green' | 'yellow' | 'red' | 'orange' | 'blue');

const riskPieLabels = computed(() => insights.value?.riskDistribution?.map((item: any) => item.label) || []);
const riskPieValues = computed(() => insights.value?.riskDistribution?.map((item: any) => item.percent) || []);
const monthlyLabels = computed(() => insights.value?.monthlyTrend?.map((item: any) => item.label) || []);
const monthlyLineDatasets = computed(() => [
  {
    label: 'Total pemeriksaan',
    values: insights.value?.monthlyTrend?.map((item: any) => item.totalCheckups) || [],
    borderColor: '#5aa38f',
    backgroundColor: 'rgba(90, 163, 143, 0.16)',
  },
  {
    label: 'Kasus dipantau',
    values: insights.value?.monthlyTrend?.map((item: any) => item.totalRisk) || [],
    borderColor: '#d66d63',
    backgroundColor: 'rgba(214, 109, 99, 0.16)',
  },
  {
    label: 'Risiko stunting',
    values: insights.value?.monthlyTrend?.map((item: any) => item.stuntingRisk) || [],
    borderColor: '#6f97d6',
    backgroundColor: 'rgba(111, 151, 214, 0.16)',
  },
]);

const monthlyTitle = computed(
  () => `Tren ${insights.value?.period?.totalMonths || 12} bulan (line chart)`,
);

const previewTotalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / previewPageSize)));
const previewRowsPaged = computed(() => {
  const start = (previewPage.value - 1) * previewPageSize;
  return rows.value.slice(start, start + previewPageSize);
});

const priorityRows = computed(() => insights.value?.priorityToddlers || []);
const priorityTotalPages = computed(() => Math.max(1, Math.ceil(priorityRows.value.length / priorityPageSize)));
const priorityRowsPaged = computed(() => {
  const start = (priorityPage.value - 1) * priorityPageSize;
  return priorityRows.value.slice(start, start + priorityPageSize);
});

const applyPeriod = async () => {
  if (period.rwId) {
    const hasRw = rwOptions.value.some((item) => String(item.value) === String(period.rwId));
    if (!hasRw) period.rwId = '';
  }
  if (period.rtId) {
    const hasRt = rtOptions.value.some((item) => String(item.value) === String(period.rtId));
    if (!hasRt) period.rtId = '';
  }
  await load();
};

onMounted(async () => {
  await masterDataStore.fetchAll();
  await load();
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Laporan</h2>
        <p class="muted-text" style="margin: 6px 0 0">Rekap balita, pemeriksaan, dan risiko dengan export PDF / Excel / CSV.</p>
      </div>
    </div>

    <AppCard>
      <div class="toolbar-row filters-grid">
        <AppInput v-model="period.startDate" type="date" label="Tanggal mulai" />
        <AppInput v-model="period.endDate" type="date" label="Tanggal akhir" />
        <AppSelect
          v-model="period.hamletId"
          label="Dusun"
          :options="masterDataStore.hamlets.map((item) => ({ label: item.name, value: item.id }))"
        />
        <AppSelect
          v-model="period.rwId"
          label="RW"
          :options="rwOptions"
          :disabled="Boolean(period.hamletId) && !rwOptions.length"
        />
        <AppSelect
          v-model="period.rtId"
          label="RT"
          :options="rtOptions"
          :disabled="Boolean(period.rwId) && !rtOptions.length"
        />
        <AppButton @click="applyPeriod">Terapkan periode</AppButton>
      </div>
      <small class="muted-text">Periode aktif: {{ periodLabel }} (default 12 bulan terakhir).</small>
    </AppCard>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat insight laporan..." />
    </AppCard>

    <template v-else-if="insights">
      <div class="grid-cards">
        <SummaryCard
          title="Total balita"
          :value="insights.summary.totalBalita"
          :caption="`Aktif ${insights.summary.balitaAktif} anak`"
        />
        <SummaryCard
          title="Balita dinilai"
          :value="insights.summary.totalDinilai"
          caption="Memiliki data pemeriksaan terbaru"
        />
        <SummaryCard
          title="Harus dipantau"
          :value="insights.summary.balitaDipantau"
          :caption="`${insights.summary.persentaseDipantau}% dari balita dinilai`"
        />
        <SummaryCard
          title="Risiko stunting"
          :value="insights.summary.stuntingCount"
          :caption="`${insights.summary.stuntingPercent}% dari balita dinilai`"
        />
      </div>

      <div class="grid-cards dashboard-split-grid">
        <AppCard>
          <div class="section-head">
            <div>
              <strong>Distribusi status risiko (%)</strong>
              <p class="muted-text">Persentase status terbaru balita yang sudah dinilai.</p>
            </div>
          </div>
          <ReportPieChart :labels="riskPieLabels" :values="riskPieValues" />
          <div class="form-grid" style="margin-top: 10px">
            <div
              v-for="item in insights.riskDistribution"
              :key="item.riskLevel"
              class="section-head"
              style="align-items: center"
            >
              <div class="inline-actions" style="gap: 8px">
                <AppBadge :tone="riskTone(item.riskLevel)">{{ riskLabel(item.riskLevel) }}</AppBadge>
              </div>
              <strong>{{ item.total }} balita ({{ item.percent }}%)</strong>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <div class="section-head">
            <div>
              <strong>{{ monthlyTitle }}</strong>
              <p class="muted-text">Total pemeriksaan, kasus dipantau, dan kasus risiko stunting per periode terpilih.</p>
            </div>
          </div>
          <ReportLineChart :labels="monthlyLabels" :datasets="monthlyLineDatasets" />
        </AppCard>
      </div>

      <div class="grid-cards dashboard-split-grid">
        <AppCard>
          <div class="section-head">
            <div>
              <strong>Sebaran balita dipantau per dusun</strong>
              <p class="muted-text">Membantu prioritas intervensi per wilayah.</p>
            </div>
          </div>
          <DashboardBarChart
            :labels="insights.hamletDistribution.slice(0, 8).map((item: any) => item.hamlet.replace('Dusun ', ''))"
            :values="insights.hamletDistribution.slice(0, 8).map((item: any) => item.totalDipantau)"
            title="Balita dipantau"
            :uniform-color="true"
            color="#5aa38f"
          />
        </AppCard>

        <AppCard>
          <div class="section-head">
            <div>
              <strong>Daftar balita prioritas dipantau</strong>
              <p class="muted-text">Urutan berdasarkan level risiko dan kebutuhan tindak lanjut.</p>
            </div>
          </div>
          <DataTable
            :columns="[
              { key: 'namaBalita', label: 'Balita' },
              { key: 'wilayah', label: 'Wilayah' },
              { key: 'riskLevel', label: 'Status' },
              { key: 'tanggalTerakhir', label: 'Terakhir diperiksa' },
            ]"
            :rows="priorityRowsPaged"
          >
            <template #namaBalita="{ row }">
              <div>
                <strong>{{ row.namaBalita }}</strong>
                <div class="muted-text">{{ row.kodeBalita }}</div>
              </div>
            </template>
            <template #wilayah="{ row }">
              <div>{{ row.dusun }}</div>
              <small class="muted-text">{{ row.posyandu }}</small>
            </template>
            <template #riskLevel="{ row }">
              <div class="form-grid" style="gap: 6px">
                <AppBadge :tone="riskTone(row.riskLevel)">{{ riskLabel(row.riskLevel) }}</AppBadge>
                <small class="muted-text">{{ row.statusLabel }}</small>
              </div>
            </template>
            <template #tanggalTerakhir="{ row }">{{ formatDate(row.tanggalTerakhir) }}</template>
          </DataTable>
          <div class="toolbar-row table-footer-row">
            <small class="muted-text">Halaman {{ priorityPage }} / {{ priorityTotalPages }}</small>
            <div class="inline-actions">
              <AppButton variant="secondary" :disabled="priorityPage <= 1" @click="priorityPage -= 1">Sebelumnya</AppButton>
              <AppButton variant="secondary" :disabled="priorityPage >= priorityTotalPages" @click="priorityPage += 1">Berikutnya</AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </template>

    <div class="grid-cards">
      <AppCard>
        <strong>Laporan data balita</strong>
        <p class="muted-text">Per dusun dan posyandu</p>
        <div class="inline-actions">
          <AppButton variant="secondary" @click="exportReport('toddlers', 'csv')">CSV</AppButton>
          <AppButton variant="secondary" @click="exportReport('toddlers', 'xlsx')">Excel</AppButton>
          <AppButton variant="secondary" @click="exportReport('toddlers', 'pdf')">PDF</AppButton>
        </div>
      </AppCard>

      <AppCard>
        <strong>Laporan pemeriksaan</strong>
        <p class="muted-text">Periode dan status pertumbuhan</p>
        <div class="inline-actions">
          <AppButton variant="secondary" @click="exportReport('checkups', 'csv')">CSV</AppButton>
          <AppButton variant="secondary" @click="exportReport('checkups', 'xlsx')">Excel</AppButton>
          <AppButton variant="secondary" @click="exportReport('checkups', 'pdf')">PDF</AppButton>
        </div>
      </AppCard>

      <AppCard>
        <strong>Laporan balita risiko</strong>
        <p class="muted-text">Daftar prioritas perhatian khusus</p>
        <div class="inline-actions">
          <AppButton variant="secondary" @click="exportReport('risk', 'csv')">CSV</AppButton>
          <AppButton variant="secondary" @click="exportReport('risk', 'xlsx')">Excel</AppButton>
          <AppButton variant="secondary" @click="exportReport('risk', 'pdf')">PDF</AppButton>
        </div>
      </AppCard>
    </div>

    <AppCard>
      <strong>Preview laporan balita</strong>
      <DataTable
        :columns="[
          { key: 'kode_balita', label: 'Kode' },
          { key: 'nama_lengkap', label: 'Nama' },
          { key: 'dusun', label: 'Dusun' },
          { key: 'rw', label: 'RW' },
          { key: 'rt', label: 'RT' },
          { key: 'posyandu', label: 'Posyandu' },
          { key: 'risiko_terakhir', label: 'Risiko' },
        ]"
        :rows="previewRowsPaged"
      />
      <div class="toolbar-row table-footer-row">
        <small class="muted-text">Halaman {{ previewPage }} / {{ previewTotalPages }}</small>
        <div class="inline-actions">
          <AppButton variant="secondary" :disabled="previewPage <= 1" @click="previewPage -= 1">Sebelumnya</AppButton>
          <AppButton variant="secondary" :disabled="previewPage >= previewTotalPages" @click="previewPage += 1">Berikutnya</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
