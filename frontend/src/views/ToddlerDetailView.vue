<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppBadge from '../components/ui/AppBadge.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import DataTable from '../components/DataTable.vue';
import GrowthActualMedianChart from '../components/charts/GrowthActualMedianChart.vue';
import GrowthLineChart from '../components/charts/GrowthLineChart.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { formatAgeFromBirthDate, formatDate, formatNumber, genderLabel, riskLabel } from '../utils/format';

const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const toddler = ref<any>(null);
const checkups = ref<any[]>([]);
const loading = ref(true);
const loadFailed = ref(false);
type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'blue';

const riskTone = (value?: string): BadgeTone =>
  ({
    NORMAL: 'green',
    ATTENTION: 'yellow',
    STUNTING_RISK: 'red',
    UNDERNUTRITION: 'orange',
    OVERWEIGHT: 'blue',
  }[value || ''] as BadgeTone) || 'blue';

onMounted(async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    toddler.value = await toddlersService.detail(String(route.params.id));
    checkups.value = await toddlersService.checkups(String(route.params.id));
  } catch (_error) {
    loadFailed.value = true;
    appStore.pushToast('Gagal memuat detail balita.', 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="form-grid">
    <AppCard>
      <AppLoadingBlock text="Memuat detail balita..." />
    </AppCard>
  </div>

  <div v-else-if="loadFailed" class="form-grid">
    <AppCard>
      <div class="empty-state">Detail balita gagal dimuat. Silakan refresh halaman.</div>
    </AppCard>
  </div>

  <div v-else-if="toddler" class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">{{ toddler.nama_lengkap }}</h2>
        <p class="muted-text" style="margin: 6px 0 0">{{ toddler.kode_balita }} • {{ toddler.hamlet?.name }} • {{ toddler.posyandu?.name }}</p>
      </div>
      <div class="inline-actions detail-actions">
        <RouterLink :to="`/balita/${toddler.id}/edit`" class="app-button">Edit</RouterLink>
        <RouterLink :to="`/balita/${toddler.id}/pemeriksaan`" class="app-button" style="background: linear-gradient(135deg, #f0b968, #e7a84f)">Input pemeriksaan</RouterLink>
        <RouterLink :to="`/kartu/${toddler.id}`" class="app-button" style="background: linear-gradient(135deg, #6f97d6, #5f80bf)">Kartu posyandu</RouterLink>
      </div>
    </div>

    <div class="grid-cards">
      <AppCard>
        <strong>Identitas</strong>
        <div class="form-grid" style="margin-top: 14px">
          <div>Jenis kelamin: <strong>{{ genderLabel(toddler.jenis_kelamin) }}</strong></div>
          <div>Tanggal lahir: <strong>{{ formatDate(toddler.tanggal_lahir) }}</strong></div>
          <div>Umur: <strong>{{ formatAgeFromBirthDate(toddler.tanggal_lahir) }}</strong></div>
          <div>Ibu: <strong>{{ toddler.nama_ibu }}</strong></div>
          <div>Ayah: <strong>{{ toddler.nama_ayah }}</strong></div>
          <div>No HP: <strong>{{ toddler.no_hp_orangtua || '-' }}</strong></div>
        </div>
      </AppCard>

      <AppCard>
        <strong>Status pertumbuhan terbaru</strong>
        <div class="form-grid" style="margin-top: 14px" v-if="toddler.latestCheckup">
          <AppBadge :tone="riskTone(toddler.latestCheckup.riskLevel)">
            {{ riskLabel(toddler.latestCheckup.riskLevel) }}
          </AppBadge>
          <div>{{ toddler.latestCheckup.statusLabel }}</div>
          <div class="muted-text">{{ toddler.latestCheckup.growthSummary }}</div>
        </div>
        <div v-else class="muted-text" style="margin-top: 14px">Belum ada histori pemeriksaan.</div>
      </AppCard>
    </div>

    <AppCard>
      <div class="section-head">
        <div>
          <strong>Grafik pertumbuhan aktual + median</strong>
          <p class="muted-text">Grafik lama tetap ditampilkan: data aktual balita dibanding median/rentang ideal pemeriksaan.</p>
        </div>
      </div>
      <GrowthActualMedianChart :items="checkups" />
    </AppCard>

    <AppCard>
      <div class="section-head">
        <div>
          <strong>Grafik pertumbuhan KIA (garis SD)</strong>
          <p class="muted-text">Grafik per balita mengacu acuan KIA per gender (L/P) dengan garis -3SD sampai +3SD.</p>
        </div>
      </div>
      <GrowthLineChart :items="checkups" :gender="toddler.jenis_kelamin" />
    </AppCard>

    <AppCard>
      <div class="section-head">
        <div>
          <strong>Riwayat pemeriksaan</strong>
          <p class="muted-text">Tabel lengkap histori, status naik/tetap/turun, dan indikator risiko</p>
        </div>
      </div>
      <DataTable
        :columns="[
          { key: 'tanggal', label: 'Tanggal' },
          { key: 'umur', label: 'Umur' },
          { key: 'ukuran', label: 'BB / TB' },
          { key: 'status', label: 'Status' },
          { key: 'risiko', label: 'Risiko' },
          { key: 'aksi', label: 'Aksi' },
        ]"
        :rows="checkups"
      >
        <template #tanggal="{ row }">{{ formatDate(row.examDate) }}</template>
        <template #umur="{ row }">{{ row.ageInMonths }} bulan</template>
        <template #ukuran="{ row }">{{ formatNumber(row.weight) }} kg / {{ formatNumber(row.height) }} cm</template>
        <template #status="{ row }">{{ row.statusLabel }}</template>
        <template #risiko="{ row }">
          <AppBadge :tone="riskTone(row.riskLevel)">{{ riskLabel(row.riskLevel) }}</AppBadge>
        </template>
        <template #aksi="{ row }">
          <RouterLink
            v-if="authStore.hasPermission('checkups.update')"
            :to="`/balita/${toddler.id}/pemeriksaan/${row.id}/edit`"
            class="app-button"
            data-variant="secondary"
          >
            Edit
          </RouterLink>
          <span v-else class="muted-text">-</span>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
