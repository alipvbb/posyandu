<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import AppBadge from '../components/ui/AppBadge.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import DashboardBarChart from '../components/charts/DashboardBarChart.vue';
import SummaryCard from '../components/SummaryCard.vue';
import { dashboardService } from '../services/dashboard.service';
import { useAppStore } from '../stores/app';
import { formatDate, riskLabel } from '../utils/format';

const appStore = useAppStore();
const loading = ref(true);
const summary = ref<any>(null);
const riskItems = ref<any[]>([]);
const attendanceSummary = computed(() => summary.value?.kepalaDesa?.ringkasanKehadiranPosyandu || null);
const hadirItems = computed(() => attendanceSummary.value?.daftarHadirBulanIni || []);
const tidakHadirItems = computed(() => attendanceSummary.value?.daftarTidakHadirBulanIni || []);
const totalBalitaAktif = computed(() => Number(summary.value?.kepalaDesa?.totalBalitaAktif || 0));
const hadirCount = computed(() => Number(attendanceSummary.value?.hadirBulanIni || 0));
const tidakHadirCount = computed(() => Number(attendanceSummary.value?.belumDiperiksaBulanIni || 0));
const hadirPercent = computed(() => {
  if (!totalBalitaAktif.value) return 0;
  return Math.round((hadirCount.value / totalBalitaAktif.value) * 100);
});
const tidakHadirPercent = computed(() => {
  if (!totalBalitaAktif.value) return 0;
  return Math.round((tidakHadirCount.value / totalBalitaAktif.value) * 100);
});
const absentSectionRef = ref<HTMLElement | null>(null);
const presentSectionRef = ref<HTMLElement | null>(null);
const attendanceFocus = ref<'absent' | 'present' | null>(null);

const riskTone = (value?: string | null) =>
  ({
    NORMAL: 'green',
    ATTENTION: 'yellow',
    STUNTING_RISK: 'red',
    UNDERNUTRITION: 'orange',
    OVERWEIGHT: 'blue',
  })[value || ''] as 'green' | 'yellow' | 'red' | 'orange' | 'blue';

const callHref = (phone?: string | null) => `tel:${String(phone || '').replace(/[^0-9+]/g, '')}`;

const goToAttendanceList = async (type: 'absent' | 'present') => {
  attendanceFocus.value = type;
  await nextTick();

  const target = type === 'absent' ? absentSectionRef.value : presentSectionRef.value;
  target?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });

  window.setTimeout(() => {
    if (attendanceFocus.value === type) attendanceFocus.value = null;
  }, 1600);
};

onMounted(async () => {
  try {
    const [summaryData, riskData] = await Promise.all([dashboardService.getSummary(), dashboardService.getRisk()]);
    summary.value = summaryData;
    riskItems.value = riskData;
  } catch (_error) {
    appStore.pushToast('Gagal memuat dashboard.', 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Ringkasan hari ini</h2>
        <p class="muted-text" style="margin: 6px 0 0">Data real-time dari pemeriksaan dan histori pertumbuhan balita desa.</p>
      </div>
      <RouterLink to="/scan-qr" class="app-button">Scan QR cepat</RouterLink>
    </div>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat dashboard..." />
    </AppCard>

    <template v-else-if="summary">
      <div class="grid-cards">
        <SummaryCard title="Total balita" :value="summary.kepalaDesa.totalBalita" caption="Seluruh data balita" />
        <SummaryCard title="Balita aktif" :value="summary.kepalaDesa.totalBalitaAktif" caption="Siap dipantau bulan ini" />
        <SummaryCard title="Balita risiko" :value="summary.kepalaDesa.jumlahBalitaRisiko" caption="Butuh perhatian lanjutan" />
        <SummaryCard title="Pertumbuhan baik" :value="summary.kepalaDesa.jumlahBalitaPertumbuhanBaik" caption="Status normal terbaru" />
      </div>

      <AppCard class="attendance-priority-card">
        <div class="section-head">
          <div>
            <strong>Informasi Utama: Kehadiran Posyandu Bulan Ini</strong>
            <p class="muted-text">Data ini menjadi prioritas utama agar balita yang belum hadir bisa segera dihubungi petugas.</p>
          </div>
        </div>
        <div class="attendance-priority-grid">
          <button
            type="button"
            class="card-panel attendance-priority-item attendance-priority-item--absent attendance-priority-item--clickable"
            @click="goToAttendanceList('absent')"
          >
            <small class="muted-text">Balita belum hadir</small>
            <strong class="attendance-priority-value">{{ tidakHadirCount }}</strong>
            <small class="muted-text">{{ tidakHadirPercent }}% dari balita aktif bulan ini</small>
          </button>
          <button
            type="button"
            class="card-panel attendance-priority-item attendance-priority-item--present attendance-priority-item--clickable"
            @click="goToAttendanceList('present')"
          >
            <small class="muted-text">Balita sudah hadir</small>
            <strong class="attendance-priority-value">{{ hadirCount }}</strong>
            <small class="muted-text">{{ hadirPercent }}% dari balita aktif bulan ini</small>
          </button>
        </div>
      </AppCard>

      <div class="grid-cards dashboard-split-grid">
        <div ref="absentSectionRef">
        <AppCard class="attendance-target-card" :class="{ 'is-focused': attendanceFocus === 'absent' }">
          <div class="section-head">
            <div>
              <strong>Balita belum datang (prioritas follow-up)</strong>
              <p class="muted-text">Fokus utama petugas untuk segera dihubungi.</p>
            </div>
            <AppBadge tone="orange">Belum hadir: {{ attendanceSummary?.belumDiperiksaBulanIni || 0 }}</AppBadge>
          </div>
          <div class="form-grid">
            <div v-if="!tidakHadirItems.length" class="card-panel dashboard-inline-card muted-text">
              Semua balita aktif sudah terdata pemeriksaannya bulan ini.
            </div>
            <div v-for="item in tidakHadirItems.slice(0, 10)" :key="`tidak-hadir-${item.id}`" class="card-panel dashboard-inline-card">
              <div class="section-head">
                <div>
                  <strong>
                    <RouterLink :to="`/balita/${item.id}`">{{ item.fullName }}</RouterLink>
                  </strong>
                  <p class="muted-text">{{ item.hamlet }} • {{ item.posyandu }}</p>
                </div>
                <AppBadge :tone="riskTone(item.latestRisk || 'NORMAL')">
                  {{ item.latestRisk ? riskLabel(item.latestRisk) : 'Belum dinilai' }}
                </AppBadge>
              </div>
              <small class="muted-text">
                Pemeriksaan terakhir: {{ item.lastExamDate ? formatDate(item.lastExamDate) : 'Belum pernah diperiksa' }}
              </small>
              <div class="inline-actions" style="margin-top: 8px">
                <RouterLink :to="`/balita/${item.id}`" class="app-button">Detail balita</RouterLink>
                <a v-if="item.parentPhone" :href="callHref(item.parentPhone)" class="app-button">Hubungi segera</a>
                <span v-else class="muted-text">No. HP orang tua belum tersedia</span>
              </div>
            </div>
          </div>
        </AppCard>
        </div>

        <div ref="presentSectionRef">
        <AppCard class="attendance-target-card" :class="{ 'is-focused': attendanceFocus === 'present' }">
          <div class="section-head">
            <div>
              <strong>Balita datang bulan ini</strong>
              <p class="muted-text">Daftar kehadiran terbaru untuk monitoring lapangan.</p>
            </div>
            <AppBadge tone="green">Hadir: {{ attendanceSummary?.hadirBulanIni || 0 }}</AppBadge>
          </div>
          <div class="form-grid">
            <div v-if="!hadirItems.length" class="card-panel dashboard-inline-card muted-text">Belum ada data kehadiran bulan ini.</div>
            <div v-for="item in hadirItems.slice(0, 10)" :key="`hadir-${item.id}`" class="card-panel dashboard-inline-card">
              <div class="section-head">
                <div>
                  <strong>
                    <RouterLink :to="`/balita/${item.id}`">{{ item.fullName }}</RouterLink>
                  </strong>
                  <p class="muted-text">{{ item.hamlet }} • {{ item.posyandu }}</p>
                </div>
                <AppBadge :tone="riskTone(item.latestRisk)">{{ riskLabel(item.latestRisk || 'NORMAL') }}</AppBadge>
              </div>
              <small class="muted-text">
                Hadir: {{ item.attendanceDate ? formatDate(item.attendanceDate) : '-' }} • Petugas: {{ item.officerName || '-' }}
              </small>
              <div class="inline-actions" style="margin-top: 8px">
                <RouterLink :to="`/balita/${item.id}`" class="app-button" data-variant="secondary">Detail balita</RouterLink>
                <a v-if="item.parentPhone" :href="callHref(item.parentPhone)" class="app-button" data-variant="secondary">Hubungi</a>
              </div>
            </div>
          </div>
        </AppCard>
        </div>
      </div>

      <div class="grid-cards dashboard-split-grid">
        <AppCard>
          <div class="section-head">
            <div>
              <strong>Pemeriksaan bulanan</strong>
              <p class="muted-text">Aktivitas posyandu 6 bulan terakhir</p>
            </div>
          </div>
          <DashboardBarChart
            :labels="summary.kepalaDesa.grafikPemeriksaanBulanan.map((item: any) => item.label)"
            :values="summary.kepalaDesa.grafikPemeriksaanBulanan.map((item: any) => item.total)"
            title="Pemeriksaan"
          />
        </AppCard>

        <AppCard>
          <div class="section-head">
            <div>
              <strong>Sebaran per dusun</strong>
              <p class="muted-text">Cakupan balita di tiap dusun</p>
            </div>
          </div>
          <DashboardBarChart
            :labels="summary.kepalaDesa.sebaranPerDusun.map((item: any) => item.name.replace('Dusun ', ''))"
            :values="summary.kepalaDesa.sebaranPerDusun.map((item: any) => item.totalToddlers)"
            title="Balita"
          />
        </AppCard>
      </div>

      <div class="grid-cards dashboard-split-grid">
        <AppCard>
          <div class="section-head">
            <div>
              <strong>Balita butuh perhatian</strong>
              <p class="muted-text">Prioritas tindak lanjut lapangan</p>
            </div>
          </div>
          <div class="form-grid">
            <div v-for="item in riskItems.slice(0, 8)" :key="item.id" class="card-panel dashboard-inline-card">
              <div class="section-head">
                <div>
                  <strong>{{ item.fullName }}</strong>
                  <p class="muted-text">{{ item.hamlet }} • {{ item.posyandu }}</p>
                </div>
                <AppBadge :tone="riskTone(item.riskLevel)">{{ riskLabel(item.riskLevel) }}</AppBadge>
              </div>
              <small class="muted-text">{{ item.statusLabel }}</small>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <div class="section-head">
            <div>
              <strong>Ringkasan petugas</strong>
              <p class="muted-text">Shortcut dan target bulan berjalan</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="card-panel dashboard-inline-card">
              Balita bulan ini: <strong>{{ summary.petugas.balitaBulanIni }}</strong>
            </div>
            <div class="card-panel dashboard-inline-card">
              Belum diperiksa bulan ini: <strong>{{ summary.petugas.balitaBelumDiperiksaBulanIni }}</strong>
            </div>
            <div class="card-panel dashboard-inline-card">
              Risiko tinggi: <strong>{{ summary.petugas.balitaRisikoTinggi }}</strong>
            </div>
            <RouterLink to="/balita" class="app-button">Buka data balita</RouterLink>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>
