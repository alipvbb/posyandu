<script setup lang="ts">
import { Icon } from '@iconify/vue';
import qrCodeIcon from '@iconify-icons/solar/qr-code-bold-duotone';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppBadge from '../components/ui/AppBadge.vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import CheckupForm from '../components/forms/CheckupForm.vue';
import QrScanner from '../components/qr/QrScanner.vue';
import { toddlersService } from '../services/toddlers.service';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { useMasterDataStore } from '../stores/master-data';
import { formatDate, riskLabel } from '../utils/format';

const appStore = useAppStore();
const authStore = useAuthStore();
const masterDataStore = useMasterDataStore();
const router = useRouter();

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const loading = ref(true);
const overview = ref<any>(null);
const searchText = ref('');
const suggestions = ref<any[]>([]);
const searching = ref(false);
const searchTimer = ref<number | null>(null);
const showScannerDialog = ref(false);
const resolvingScan = ref(false);
const manualScanValue = ref('');
const scannerError = ref('');
const lastScannedValue = ref('');
const lastScannedAt = ref(0);
const showCheckupDialog = ref(false);
const dialogSaving = ref(false);
const selectedToddler = ref<any>(null);

const summary = computed(() => overview.value?.summary || null);
const presentItems = computed(() => overview.value?.presentToddlers || []);
const absentItems = computed(() => overview.value?.absentToddlers || []);
const presentIds = computed(() => new Set(presentItems.value.map((item: any) => item.toddlerId)));
const canCreateCheckup = computed(() => authStore.hasPermission('checkups.create'));
const canScanQr = computed(() => authStore.hasPermission('qrcode.scan'));
const canViewToddler = computed(() => authStore.hasPermission('toddlers.view'));
const showSuggestions = computed(() => searchText.value.trim().length > 0 && (suggestions.value.length > 0 || searching.value));
const initialExamDate = computed(() => {
  const today = new Date();
  const monthNow = today.toISOString().slice(0, 7);
  if (selectedMonth.value === monthNow) return today.toISOString().slice(0, 10);
  return `${selectedMonth.value}-01`;
});

const riskTone = (value?: string | null) =>
  ({
    NORMAL: 'green',
    ATTENTION: 'yellow',
    STUNTING_RISK: 'red',
    UNDERNUTRITION: 'orange',
    OVERWEIGHT: 'blue',
  })[value || ''] as 'green' | 'yellow' | 'red' | 'orange' | 'blue';
const isAlreadyCheckedThisMonth = (toddlerId: number) => presentIds.value.has(toddlerId);

const toLocalDateKey = (value: string | Date) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeShort = (value?: string | Date | null) => {
  if (!value) return '--:--';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const todayPresentItems = computed(() => {
  const todayKey = toLocalDateKey(new Date());
  return presentItems.value
    .filter((item: any) => item.examDate && toLocalDateKey(item.examDate) === todayKey)
    .sort((a: any, b: any) => new Date(b.examDate).valueOf() - new Date(a.examDate).valueOf());
});

const callHref = (phone?: string | null) => `tel:${String(phone || '').replace(/[^0-9+]/g, '')}`;
const waNumber = (phone?: string | null) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
};
const waMessage = (item: any) =>
  `Yth Bapak/Ibu orang tua ${item.fullName}, mohon untuk hadir di ${item.posyandu} (${item.rt || '-'}, ${item.rw || '-'}) sesuai data balita. Terima kasih.`;
const waHref = (item: any) => `https://wa.me/${waNumber(item.parentPhone)}?text=${encodeURIComponent(waMessage(item))}`;
const formatMonthLabel = (value?: string) => {
  if (!value) return '-';
  const [year, month] = value.split('-').map((item) => Number(item));
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

const loadOverview = async () => {
  loading.value = true;
  try {
    overview.value = await toddlersService.monthlyCheckups(selectedMonth.value);
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal memuat data pemeriksaan bulanan.', 'error');
  } finally {
    loading.value = false;
  }
};

const searchToddlers = async (query: string) => {
  const term = query.trim();
  if (!term) {
    suggestions.value = [];
    return;
  }
  searching.value = true;
  try {
    const listResponse = await toddlersService.list({
      search: term,
      status: 'ACTIVE',
      page: 1,
      pageSize: 8,
    });
    suggestions.value = listResponse.data || [];
  } catch (_error) {
    suggestions.value = [];
  } finally {
    searching.value = false;
  }
};

watch(searchText, (value) => {
  if (searchTimer.value) window.clearTimeout(searchTimer.value);
  searchTimer.value = window.setTimeout(() => {
    searchToddlers(value);
  }, 250);
});

watch(selectedMonth, async () => {
  await loadOverview();
  if (searchText.value.trim()) {
    await searchToddlers(searchText.value);
  }
});

watch(showScannerDialog, (open) => {
  if (open) return;
  scannerError.value = '';
  manualScanValue.value = '';
});

const openCheckupPopupWithToddler = async (toddlerId: number | string) => {
  if (!canCreateCheckup.value) {
    if (canViewToddler.value) {
      appStore.pushToast('Anda tidak punya izin input. Dialihkan ke detail balita.', 'info');
      await router.push(`/balita/${toddlerId}`);
      return;
    }
    appStore.pushToast('Anda tidak punya izin input pemeriksaan.', 'error');
    return;
  }
  try {
    selectedToddler.value = await toddlersService.detail(toddlerId);
    showCheckupDialog.value = true;
  } catch (_error) {
    appStore.pushToast('Gagal memuat detail balita.', 'error');
  }
};

const pickSuggestion = async (item: any) => {
  searchText.value = '';
  suggestions.value = [];
  await openCheckupPopupWithToddler(item.id);
};

const shouldProcessScan = (value: string) => {
  const now = Date.now();
  if (lastScannedValue.value === value && now - lastScannedAt.value < 2500) return false;
  lastScannedValue.value = value;
  lastScannedAt.value = now;
  return true;
};

const handleScan = async (value: string, source: 'camera' | 'manual' = 'camera') => {
  if (!canScanQr.value) return;
  const normalized = value.trim();
  if (!normalized || resolvingScan.value) return;
  if (source === 'camera' && !shouldProcessScan(normalized)) return;

  resolvingScan.value = true;
  try {
    const result = await toddlersService.resolveScan(normalized);
    showScannerDialog.value = false;
    manualScanValue.value = '';
    scannerError.value = '';
    await openCheckupPopupWithToddler(result.toddlerId);
    appStore.pushToast('QR dikenali, form pemeriksaan dibuka.', 'success');
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'QR tidak dikenali.', 'error');
  } finally {
    resolvingScan.value = false;
  }
};

const openScannerDialog = () => {
  if (!canScanQr.value) {
    appStore.pushToast('Role ini belum punya izin scan QR. Gunakan pencarian nama/kode balita.', 'error');
    return;
  }
  showScannerDialog.value = true;
};

const submitCheckup = async (payload: Record<string, any>) => {
  if (!selectedToddler.value) return;
  dialogSaving.value = true;
  try {
    await toddlersService.createCheckup(selectedToddler.value.id, payload);
    appStore.pushToast('Pemeriksaan berhasil disimpan.', 'success');
    showCheckupDialog.value = false;
    selectedToddler.value = null;
    await loadOverview();
    if (searchText.value.trim()) {
      await searchToddlers(searchText.value);
    }
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal menyimpan pemeriksaan.', 'error');
  } finally {
    dialogSaving.value = false;
  }
};

onMounted(async () => {
  await masterDataStore.fetchAll();
  await loadOverview();
});
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Pemeriksaan Bulanan</h2>
        <p class="muted-text" style="margin: 6px 0 0">Pantau kehadiran bulanan balita, cari cepat, scan QR, lalu input pemeriksaan dalam popup.</p>
      </div>
      <AppInput v-model="selectedMonth" type="month" label="Bulan pemeriksaan" />
    </div>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat data pemeriksaan bulanan..." />
    </AppCard>

    <template v-else>
      <AppCard class="attendance-priority-card">
        <div class="section-head">
          <div>
            <strong>Informasi Utama Kehadiran (By Month)</strong>
            <p class="muted-text">Bulan {{ formatMonthLabel(overview?.month || selectedMonth) }} • prioritas utama untuk follow-up balita belum hadir.</p>
          </div>
        </div>
        <div class="attendance-priority-grid">
          <div class="card-panel attendance-priority-item attendance-priority-item--absent">
            <small class="muted-text">Balita belum hadir</small>
            <strong class="attendance-priority-value">{{ summary?.absentCount || 0 }}</strong>
            <small class="muted-text">{{ summary?.absentPercent || 0 }}% dari balita aktif</small>
          </div>
          <div class="card-panel attendance-priority-item attendance-priority-item--present">
            <small class="muted-text">Balita sudah hadir</small>
            <strong class="attendance-priority-value">{{ summary?.presentCount || 0 }}</strong>
            <small class="muted-text">{{ summary?.presentPercent || 0 }}% dari balita aktif</small>
          </div>
        </div>
      </AppCard>

      <AppCard class="checkup-input-card">
        <div class="section-head">
          <div>
            <strong>Input pemeriksaan (search atau scan QR)</strong>
            <p class="muted-text">Cukup satu textbox. Cari nama/kode balita, atau scan QR dari ikon di dalam textbox.</p>
          </div>
        </div>
        <div class="daily-checkup-search">
          <input
            v-model="searchText"
            class="daily-checkup-search-input"
            type="text"
            placeholder="Cari nama / kode balita..."
          />
          <button
            type="button"
            class="daily-checkup-search-qr"
            :disabled="resolvingScan"
            :title="canScanQr ? 'Scan QR' : 'Tidak punya izin scan QR'"
            @click="openScannerDialog"
          >
            <Icon :icon="qrCodeIcon" width="18" />
          </button>
          <div v-if="showSuggestions" class="daily-checkup-suggest">
            <div v-if="searching" class="daily-checkup-suggest-empty">Mencari balita...</div>
            <template v-else>
              <button
                v-for="item in suggestions"
                :key="item.id"
                type="button"
                class="daily-checkup-suggest-item"
                @click="pickSuggestion(item)"
              >
                <strong>{{ item.nama_lengkap }}</strong>
                <small>{{ item.kode_balita }} • {{ item.hamlet?.name }} • {{ item.posyandu?.name }}</small>
                <small :class="isAlreadyCheckedThisMonth(item.id) ? 'suggest-state suggest-state--done' : 'suggest-state suggest-state--new'">
                  {{ isAlreadyCheckedThisMonth(item.id) ? 'Sudah diperiksa bulan ini' : 'Belum diperiksa bulan ini' }}
                </small>
              </button>
            </template>
            <div v-if="!searching && !suggestions.length" class="daily-checkup-suggest-empty">
              Tidak ada balita aktif yang perlu input untuk kata kunci ini.
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard class="today-input-mini-card">
        <div class="section-head">
          <div>
            <strong>Input hari ini</strong>
            <p class="muted-text">List cepat balita yang baru diinput hari ini.</p>
          </div>
          <AppBadge tone="blue">{{ todayPresentItems.length }}</AppBadge>
        </div>
        <div v-if="!todayPresentItems.length" class="today-mini-empty">Belum ada input pemeriksaan hari ini.</div>
        <div v-else class="today-mini-list">
          <button
            v-for="item in todayPresentItems.slice(0, 20)"
            :key="`today-${item.checkupId}`"
            type="button"
            class="today-mini-item"
            @click="router.push(`/balita/${item.toddlerId}`)"
          >
            <span class="today-mini-time">{{ formatTimeShort(item.examDate) }}</span>
            <span class="today-mini-name">{{ item.fullName }}</span>
            <span class="today-mini-risk">{{ riskLabel(item.riskLevel || 'NORMAL') }}</span>
          </button>
        </div>
      </AppCard>

      <div class="grid-cards dashboard-split-grid">
        <AppCard>
          <div class="section-head">
            <div>
              <strong>Balita belum hadir</strong>
              <p class="muted-text">Daftar utama untuk segera dihubungi.</p>
            </div>
            <AppBadge tone="orange">{{ absentItems.length }} anak</AppBadge>
          </div>
          <div class="form-grid">
            <div v-if="!absentItems.length" class="card-panel dashboard-inline-card muted-text">Semua balita aktif sudah hadir pada bulan ini.</div>
            <div v-for="item in absentItems.slice(0, 20)" :key="`absent-${item.toddlerId}`" class="card-panel dashboard-inline-card">
              <div class="section-head">
                <div>
                  <strong><RouterLink :to="`/balita/${item.toddlerId}`">{{ item.fullName }}</RouterLink></strong>
                  <p class="muted-text">{{ item.hamlet }} • {{ item.posyandu }}</p>
                </div>
                <AppBadge :tone="riskTone(item.latestRisk || 'NORMAL')">
                  {{ item.latestRisk ? riskLabel(item.latestRisk) : 'Belum dinilai' }}
                </AppBadge>
              </div>
              <small class="muted-text">Pemeriksaan terakhir: {{ item.lastExamDate ? formatDate(item.lastExamDate) : 'Belum pernah' }}</small>
              <div class="inline-actions" style="margin-top: 8px">
                <RouterLink :to="`/balita/${item.toddlerId}`" class="app-button">Detail balita</RouterLink>
                <a
                  v-if="item.parentPhone"
                  :href="waHref(item)"
                  class="app-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hubungi segera
                </a>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <div class="section-head">
            <div>
              <strong>Balita sudah hadir</strong>
              <p class="muted-text">Siapa saja yang sudah diperiksa saat ini.</p>
            </div>
            <AppBadge tone="green">{{ presentItems.length }} anak</AppBadge>
          </div>
          <div class="form-grid">
            <div v-if="!presentItems.length" class="card-panel dashboard-inline-card muted-text">Belum ada balita yang diperiksa pada bulan ini.</div>
            <div v-for="item in presentItems.slice(0, 20)" :key="`present-${item.checkupId}`" class="card-panel dashboard-inline-card">
              <div class="section-head">
                <div>
                  <strong><RouterLink :to="`/balita/${item.toddlerId}`">{{ item.fullName }}</RouterLink></strong>
                  <p class="muted-text">{{ item.hamlet }} • {{ item.posyandu }}</p>
                </div>
                <AppBadge :tone="riskTone(item.riskLevel)">{{ riskLabel(item.riskLevel || 'NORMAL') }}</AppBadge>
              </div>
              <small class="muted-text">
                Diperiksa: {{ item.examDate ? formatDate(item.examDate) : '-' }} • Petugas: {{ item.officerName || '-' }}
              </small>
              <div class="inline-actions" style="margin-top: 8px">
                <RouterLink :to="`/balita/${item.toddlerId}`" class="app-button" data-variant="secondary">Detail balita</RouterLink>
                <a v-if="item.parentPhone" :href="callHref(item.parentPhone)" class="app-button" data-variant="secondary">Hubungi</a>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </template>

    <AppDialog :open="showScannerDialog" title="Scan QR Balita" @close="showScannerDialog = false">
      <div class="form-grid">
        <p class="muted-text" style="margin: 0">Arahkan kamera ke kartu posyandu. Setelah QR terbaca, popup pengisian pemeriksaan otomatis ditampilkan.</p>
        <template v-if="canScanQr">
          <QrScanner
            @scan="handleScan($event, 'camera')"
            @error="
              scannerError = $event;
              appStore.pushToast($event, 'error');
            "
          />
          <p v-if="scannerError" class="muted-text" style="margin: 0">{{ scannerError }}</p>
          <div class="toolbar-row">
            <AppInput v-model="manualScanValue" label="Input manual QR" placeholder="Tempel nilai QR jika kamera gagal..." />
            <AppButton type="button" :disabled="resolvingScan || !manualScanValue.trim()" @click="handleScan(manualScanValue, 'manual')">
              {{ resolvingScan ? 'Memproses...' : 'Proses QR' }}
            </AppButton>
          </div>
        </template>
        <p v-else class="muted-text" style="margin: 0">Role Anda belum punya izin `scan QR`. Hubungi Admin untuk menambahkan permission `qrcode.scan`.</p>
      </div>
    </AppDialog>

    <AppDialog :open="showCheckupDialog" title="Input Pemeriksaan (Popup)" @close="showCheckupDialog = false">
      <div class="form-grid" v-if="selectedToddler">
        <div>
          <strong>{{ selectedToddler.nama_lengkap }}</strong>
          <p class="muted-text" style="margin: 4px 0 0">{{ selectedToddler.kode_balita }} • {{ selectedToddler.hamlet?.name }} • {{ selectedToddler.posyandu?.name }}</p>
        </div>
        <CheckupForm
          :toddler-id="selectedToddler.id"
          :loading="dialogSaving"
          :initial-value="{ examDate: initialExamDate, posyanduId: selectedToddler.id_posyandu || selectedToddler.posyandu?.id, officerName: authStore.user?.name || 'Petugas' }"
          @submit="submitCheckup"
        />
      </div>
    </AppDialog>
  </div>
</template>
