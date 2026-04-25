<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppBadge from '../components/ui/AppBadge.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DataTable from '../components/DataTable.vue';
import GrowthActualMedianChart from '../components/charts/GrowthActualMedianChart.vue';
import GrowthLineChart from '../components/charts/GrowthLineChart.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { formatDate, formatNumber, genderLabel, riskLabel } from '../utils/format';

const route = useRoute();
const appStore = useAppStore();
const data = ref<any>(null);
const years = ref('2');
const loading = ref(true);
const loadFailed = ref(false);
type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'blue';

const load = async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    data.value = await toddlersService.getPublicCard(String(route.params.token), years.value);
  } catch (_error) {
    data.value = null;
    loadFailed.value = true;
    appStore.pushToast('Gagal memuat kartu publik.', 'error');
  } finally {
    loading.value = false;
  }
};

const riskTone = (value?: string): BadgeTone =>
  ({
    NORMAL: 'green',
    ATTENTION: 'yellow',
    STUNTING_RISK: 'red',
    UNDERNUTRITION: 'orange',
    OVERWEIGHT: 'blue',
  }[value || ''] as BadgeTone) || 'blue';

onMounted(load);
watch(years, load);
</script>

<template>
  <div class="public-card-page" v-if="loading">
    <AppCard>
      <AppLoadingBlock text="Memuat kartu tumbuh kembang..." />
    </AppCard>
  </div>

  <div class="public-card-page" v-else-if="loadFailed">
    <AppCard>
      <div class="empty-state">Kartu publik tidak dapat dimuat. Coba buka ulang link QR.</div>
    </AppCard>
  </div>

  <div class="public-card-page" v-else-if="data">
    <AppCard>
      <div class="section-head">
        <div>
          <h1 style="margin: 0 0 6px">Kartu Tumbuh Kembang Balita</h1>
          <p class="muted-text" style="margin: 0">{{ data.toddler.fullName }} • {{ data.toddler.posyandu }}</p>
        </div>
        <AppSelect
          v-model="years"
          label="Tampilkan histori"
          :options="[
            { label: '1 tahun', value: '1' },
            { label: '2 tahun', value: '2' },
            { label: '3 tahun', value: '3' },
            { label: '5 tahun', value: '5' },
            { label: 'Semua', value: 'all' },
          ]"
        />
      </div>

      <div class="grid-cards" style="margin-top: 16px">
        <div class="card-panel" style="padding: 14px; box-shadow: none">
          <strong>Identitas anak</strong>
          <div class="form-grid" style="margin-top: 10px">
            <div>Jenis kelamin: <strong>{{ genderLabel(data.toddler.gender) }}</strong></div>
            <div>Tanggal lahir: <strong>{{ formatDate(data.toddler.birthDate) }}</strong></div>
            <div>Orang tua: <strong>{{ data.toddler.motherName }}</strong></div>
          </div>
        </div>

        <div class="card-panel" style="padding: 14px; box-shadow: none">
          <strong>Status terbaru</strong>
          <div class="form-grid" style="margin-top: 10px" v-if="data.latestCheckup">
            <AppBadge :tone="riskTone(data.latestCheckup.riskLevel)">{{ riskLabel(data.latestCheckup.riskLevel) }}</AppBadge>
            <div>{{ data.latestCheckup.statusLabel }}</div>
            <div class="muted-text">BB {{ formatNumber(data.latestCheckup.weight) }} kg • TB {{ formatNumber(data.latestCheckup.height) }} cm</div>
          </div>
        </div>
      </div>
    </AppCard>

    <AppCard>
      <strong>Grafik pertumbuhan aktual + median</strong>
      <p class="muted-text">Grafik lama tetap tersedia untuk melihat tren aktual dan median/rentang ideal tiap pemeriksaan.</p>
      <GrowthActualMedianChart :items="data.history" />
    </AppCard>

    <AppCard>
      <strong>Grafik pertumbuhan KIA (garis SD)</strong>
      <p class="muted-text">Pilih periode histori. Grafik mengikuti acuan KIA per gender (garis SD) + data aktual anak.</p>
      <GrowthLineChart :items="data.history" :gender="data.toddler.gender" />
    </AppCard>

    <AppCard>
      <strong>Riwayat pemeriksaan</strong>
      <DataTable
        :columns="[
          { key: 'examDate', label: 'Tanggal' },
          { key: 'ageInMonths', label: 'Umur' },
          { key: 'weight', label: 'BB' },
          { key: 'height', label: 'TB' },
          { key: 'riskLevel', label: 'Status' },
        ]"
        :rows="data.history"
      >
        <template #examDate="{ row }">{{ formatDate(row.examDate) }}</template>
        <template #ageInMonths="{ row }">{{ row.ageInMonths }} bulan</template>
        <template #weight="{ row }">{{ formatNumber(row.weight) }} kg</template>
        <template #height="{ row }">{{ formatNumber(row.height) }} cm</template>
        <template #riskLevel="{ row }">
          <AppBadge :tone="riskTone(row.riskLevel)">{{ riskLabel(row.riskLevel) }}</AppBadge>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
