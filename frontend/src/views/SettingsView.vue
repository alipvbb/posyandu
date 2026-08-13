<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInfoNote from '../components/ui/AppInfoNote.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DataTable from '../components/DataTable.vue';
import { regionAdminService } from '../services/region-admin.service';
import { useAppStore } from '../stores/app';
import { extractApiErrorMessage } from '../utils/feedback';

const appStore = useAppStore();
const loading = ref(true);
const busyAction = ref('');

const hamlets = ref<any[]>([]);
const rws = ref<any[]>([]);
const rts = ref<any[]>([]);
const posyandus = ref<any[]>([]);

const hamletDialogOpen = ref(false);
const rwDialogOpen = ref(false);
const rtDialogOpen = ref(false);
const posyanduDialogOpen = ref(false);

const hamletForm = reactive({
  id: null as number | null,
  name: '',
});

const rwForm = reactive({
  id: null as number | null,
  hamletId: '',
  name: '',
});

const rtForm = reactive({
  id: null as number | null,
  rwId: '',
  name: '',
});

const posyanduForm = reactive({
  id: null as number | null,
  hamletId: '',
  name: '',
  locationAddress: '',
  scheduleDay: '',
  contactPhone: '',
});

const hamletOptions = computed(() => hamlets.value.map((item) => ({ label: item.name, value: String(item.id) })));
const rwOptions = computed(() =>
  rws.value.map((item) => ({
    label: `${item.name} • ${item.hamlet?.name || '-'}`,
    value: String(item.id),
  })),
);

const isBusy = (action: string) => busyAction.value === action;
const isAnyBusy = computed(() => Boolean(busyAction.value));

const closeHamletDialog = () => {
  if (isAnyBusy.value) return;
  hamletDialogOpen.value = false;
};

const closeRwDialog = () => {
  if (isAnyBusy.value) return;
  rwDialogOpen.value = false;
};

const closeRtDialog = () => {
  if (isAnyBusy.value) return;
  rtDialogOpen.value = false;
};

const closePosyanduDialog = () => {
  if (isAnyBusy.value) return;
  posyanduDialogOpen.value = false;
};

const loadAll = async () => {
  loading.value = true;
  try {
    const [hamletItems, rwItems, rtItems, posyanduItems] = await Promise.all([
      regionAdminService.listHamlets(),
      regionAdminService.listRws(),
      regionAdminService.listRts(),
      regionAdminService.listPosyandus(),
    ]);
    hamlets.value = hamletItems;
    rws.value = rwItems;
    rts.value = rtItems;
    posyandus.value = posyanduItems;
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal memuat data wilayah dan posyandu.'), 'error');
  } finally {
    loading.value = false;
  }
};

const resetHamletForm = () => {
  hamletForm.id = null;
  hamletForm.name = '';
};

const resetRwForm = () => {
  rwForm.id = null;
  rwForm.hamletId = '';
  rwForm.name = '';
};

const resetRtForm = () => {
  rtForm.id = null;
  rtForm.rwId = '';
  rtForm.name = '';
};

const resetPosyanduForm = () => {
  posyanduForm.id = null;
  posyanduForm.hamletId = '';
  posyanduForm.name = '';
  posyanduForm.locationAddress = '';
  posyanduForm.scheduleDay = '';
  posyanduForm.contactPhone = '';
};

const openCreateHamlet = () => {
  if (isAnyBusy.value) return;
  resetHamletForm();
  hamletDialogOpen.value = true;
};

const openEditHamlet = (item: any) => {
  if (isAnyBusy.value) return;
  hamletForm.id = item.id;
  hamletForm.name = item.name || '';
  hamletDialogOpen.value = true;
};

const saveHamlet = async () => {
  if (isAnyBusy.value) return;
  if (!hamletForm.name.trim()) {
    appStore.pushToast('Nama dusun wajib diisi.', 'error');
    return;
  }
  try {
    busyAction.value = 'saveHamlet';
    if (hamletForm.id) {
      await regionAdminService.updateHamlet(hamletForm.id, { name: hamletForm.name.trim() });
    } else {
      await regionAdminService.createHamlet({ name: hamletForm.name.trim() });
    }
    appStore.pushToast('Data dusun berhasil disimpan.', 'success');
    hamletDialogOpen.value = false;
    resetHamletForm();
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menyimpan dusun.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const removeHamlet = async (item: any) => {
  if (isAnyBusy.value) return;
  if (!confirm(`Hapus dusun "${item.name}"?`)) return;
  try {
    busyAction.value = `removeHamlet:${item.id}`;
    await regionAdminService.deleteHamlet(item.id);
    appStore.pushToast('Dusun berhasil dihapus.', 'success');
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menghapus dusun.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const openCreateRw = () => {
  if (isAnyBusy.value) return;
  resetRwForm();
  rwDialogOpen.value = true;
};

const openEditRw = (item: any) => {
  if (isAnyBusy.value) return;
  rwForm.id = item.id;
  rwForm.hamletId = item.hamletId ? String(item.hamletId) : '';
  rwForm.name = item.name || '';
  rwDialogOpen.value = true;
};

const saveRw = async () => {
  if (isAnyBusy.value) return;
  if (!rwForm.hamletId || !rwForm.name.trim()) {
    appStore.pushToast('Pilih dusun dan isi nama RW.', 'error');
    return;
  }
  try {
    busyAction.value = 'saveRw';
    if (rwForm.id) {
      await regionAdminService.updateRw(rwForm.id, { hamletId: Number(rwForm.hamletId), name: rwForm.name.trim() });
    } else {
      await regionAdminService.createRw({ hamletId: Number(rwForm.hamletId), name: rwForm.name.trim() });
    }
    appStore.pushToast('Data RW berhasil disimpan.', 'success');
    rwDialogOpen.value = false;
    resetRwForm();
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menyimpan RW.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const removeRw = async (item: any) => {
  if (isAnyBusy.value) return;
  if (!confirm(`Hapus ${item.name}?`)) return;
  try {
    busyAction.value = `removeRw:${item.id}`;
    await regionAdminService.deleteRw(item.id);
    appStore.pushToast('RW berhasil dihapus.', 'success');
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menghapus RW.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const openCreateRt = () => {
  if (isAnyBusy.value) return;
  resetRtForm();
  rtDialogOpen.value = true;
};

const openEditRt = (item: any) => {
  if (isAnyBusy.value) return;
  rtForm.id = item.id;
  rtForm.rwId = item.rwId ? String(item.rwId) : '';
  rtForm.name = item.name || '';
  rtDialogOpen.value = true;
};

const saveRt = async () => {
  if (isAnyBusy.value) return;
  if (!rtForm.rwId || !rtForm.name.trim()) {
    appStore.pushToast('Pilih RW dan isi nama RT.', 'error');
    return;
  }
  try {
    busyAction.value = 'saveRt';
    if (rtForm.id) {
      await regionAdminService.updateRt(rtForm.id, { rwId: Number(rtForm.rwId), name: rtForm.name.trim() });
    } else {
      await regionAdminService.createRt({ rwId: Number(rtForm.rwId), name: rtForm.name.trim() });
    }
    appStore.pushToast('Data RT berhasil disimpan.', 'success');
    rtDialogOpen.value = false;
    resetRtForm();
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menyimpan RT.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const removeRt = async (item: any) => {
  if (isAnyBusy.value) return;
  if (!confirm(`Hapus ${item.name}?`)) return;
  try {
    busyAction.value = `removeRt:${item.id}`;
    await regionAdminService.deleteRt(item.id);
    appStore.pushToast('RT berhasil dihapus.', 'success');
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menghapus RT.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const openCreatePosyandu = () => {
  if (isAnyBusy.value) return;
  resetPosyanduForm();
  posyanduDialogOpen.value = true;
};

const openEditPosyandu = (item: any) => {
  if (isAnyBusy.value) return;
  posyanduForm.id = item.id;
  posyanduForm.hamletId = item.hamletId ? String(item.hamletId) : '';
  posyanduForm.name = item.name || '';
  posyanduForm.locationAddress = item.locationAddress || '';
  posyanduForm.scheduleDay = item.scheduleDay || '';
  posyanduForm.contactPhone = item.contactPhone || '';
  posyanduDialogOpen.value = true;
};

const savePosyandu = async () => {
  if (isAnyBusy.value) return;
  if (!posyanduForm.hamletId || !posyanduForm.name.trim()) {
    appStore.pushToast('Pilih dusun dan isi nama posyandu.', 'error');
    return;
  }
  const payload = {
    hamletId: Number(posyanduForm.hamletId),
    name: posyanduForm.name.trim(),
    locationAddress: posyanduForm.locationAddress.trim() || null,
    scheduleDay: posyanduForm.scheduleDay.trim() || null,
    contactPhone: posyanduForm.contactPhone.trim() || null,
  };
  try {
    busyAction.value = 'savePosyandu';
    if (posyanduForm.id) {
      await regionAdminService.updatePosyandu(posyanduForm.id, payload);
    } else {
      await regionAdminService.createPosyandu(payload);
    }
    appStore.pushToast('Data posyandu berhasil disimpan.', 'success');
    posyanduDialogOpen.value = false;
    resetPosyanduForm();
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menyimpan posyandu.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

const removePosyandu = async (item: any) => {
  if (isAnyBusy.value) return;
  if (!confirm(`Hapus posyandu "${item.name}"?`)) return;
  try {
    busyAction.value = `removePosyandu:${item.id}`;
    await regionAdminService.deletePosyandu(item.id);
    appStore.pushToast('Posyandu berhasil dihapus.', 'success');
    await loadAll();
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal menghapus posyandu.'), 'error');
  } finally {
    busyAction.value = '';
  }
};

onMounted(loadAll);
</script>

<template>
  <div class="form-grid">
    <AppCard>
      <strong>Pengaturan Wilayah dan Posyandu</strong>
      <p class="muted-text" style="margin: 8px 0 0">
        Data Dusun, RW, RT, dan Posyandu dikelola langsung oleh Admin Desa. Data ini akan dipakai pada Master KK, Balita, dan Pemeriksaan.
      </p>
      <AppInfoNote title="Urutan aman pengisian" style="margin-top: 10px">
        Buat Dusun dulu, lalu RW di dalam Dusun, RT di dalam RW, kemudian Posyandu. Data yang dibuat di sini otomatis muncul di combobox Master KK dan Data Balita.
      </AppInfoNote>
    </AppCard>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat data wilayah..." />
    </AppCard>

    <template v-else>
      <AppCard>
        <div class="section-head">
          <strong>Dusun</strong>
          <AppButton :disabled="isAnyBusy" @click="openCreateHamlet">Tambah Dusun</AppButton>
        </div>
        <DataTable :columns="[{ key: 'name', label: 'Nama Dusun' }, { key: 'summary', label: 'Ringkasan' }, { key: 'aksi', label: 'Aksi' }]" :rows="hamlets">
          <template #summary="{ row }">
            RW: {{ row._count?.rws || 0 }} • Posyandu: {{ row._count?.posyandus || 0 }}
          </template>
          <template #aksi="{ row }">
            <div class="inline-actions">
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="openEditHamlet(row)">Edit</button>
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="removeHamlet(row)">
                {{ isBusy(`removeHamlet:${row.id}`) ? 'Menghapus...' : 'Hapus' }}
              </button>
            </div>
          </template>
        </DataTable>
      </AppCard>

      <AppCard>
        <div class="section-head">
          <strong>RW</strong>
          <AppButton :disabled="isAnyBusy" @click="openCreateRw">Tambah RW</AppButton>
        </div>
        <DataTable :columns="[{ key: 'name', label: 'Nama RW' }, { key: 'hamlet', label: 'Dusun' }, { key: 'summary', label: 'Ringkasan' }, { key: 'aksi', label: 'Aksi' }]" :rows="rws">
          <template #hamlet="{ row }">{{ row.hamlet?.name || '-' }}</template>
          <template #summary="{ row }">RT: {{ row._count?.rts || 0 }} • Balita: {{ row._count?.toddlers || 0 }}</template>
          <template #aksi="{ row }">
            <div class="inline-actions">
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="openEditRw(row)">Edit</button>
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="removeRw(row)">
                {{ isBusy(`removeRw:${row.id}`) ? 'Menghapus...' : 'Hapus' }}
              </button>
            </div>
          </template>
        </DataTable>
      </AppCard>

      <AppCard>
        <div class="section-head">
          <strong>RT</strong>
          <AppButton :disabled="isAnyBusy" @click="openCreateRt">Tambah RT</AppButton>
        </div>
        <DataTable :columns="[{ key: 'name', label: 'Nama RT' }, { key: 'rw', label: 'RW' }, { key: 'hamlet', label: 'Dusun' }, { key: 'aksi', label: 'Aksi' }]" :rows="rts">
          <template #rw="{ row }">{{ row.rw?.name || '-' }}</template>
          <template #hamlet="{ row }">{{ row.rw?.hamlet?.name || '-' }}</template>
          <template #aksi="{ row }">
            <div class="inline-actions">
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="openEditRt(row)">Edit</button>
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="removeRt(row)">
                {{ isBusy(`removeRt:${row.id}`) ? 'Menghapus...' : 'Hapus' }}
              </button>
            </div>
          </template>
        </DataTable>
      </AppCard>

      <AppCard>
        <div class="section-head">
          <strong>Posyandu</strong>
          <AppButton :disabled="isAnyBusy" @click="openCreatePosyandu">Tambah Posyandu</AppButton>
        </div>
        <DataTable
          :columns="[{ key: 'name', label: 'Nama Posyandu' }, { key: 'hamlet', label: 'Dusun' }, { key: 'detail', label: 'Detail' }, { key: 'summary', label: 'Ringkasan' }, { key: 'aksi', label: 'Aksi' }]"
          :rows="posyandus"
        >
          <template #hamlet="{ row }">{{ row.hamlet?.name || '-' }}</template>
          <template #detail="{ row }">
            <div>{{ row.locationAddress || '-' }}</div>
            <small class="muted-text">Jadwal: {{ row.scheduleDay || '-' }} • Kontak: {{ row.contactPhone || '-' }}</small>
          </template>
          <template #summary="{ row }">Balita: {{ row._count?.toddlers || 0 }} • Pemeriksaan: {{ row._count?.checkups || 0 }}</template>
          <template #aksi="{ row }">
            <div class="inline-actions">
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="openEditPosyandu(row)">Edit</button>
              <button class="ghost-button" type="button" :disabled="isAnyBusy" @click="removePosyandu(row)">
                {{ isBusy(`removePosyandu:${row.id}`) ? 'Menghapus...' : 'Hapus' }}
              </button>
            </div>
          </template>
        </DataTable>
      </AppCard>
    </template>

    <AppDialog :open="hamletDialogOpen" :title="hamletForm.id ? 'Edit Dusun' : 'Tambah Dusun'" @close="closeHamletDialog">
      <form class="form-grid" @submit.prevent="saveHamlet">
        <AppInput v-model="hamletForm.name" label="Nama Dusun" required hint="Contoh: Dusun Krajan, Dusun Brangkal Barat." />
        <div class="inline-actions">
          <AppButton type="submit" :disabled="isAnyBusy">{{ isBusy('saveHamlet') ? 'Menyimpan...' : 'Simpan' }}</AppButton>
          <AppButton type="button" variant="secondary" :disabled="isAnyBusy" @click="closeHamletDialog">Batal</AppButton>
        </div>
      </form>
    </AppDialog>

    <AppDialog :open="rwDialogOpen" :title="rwForm.id ? 'Edit RW' : 'Tambah RW'" @close="closeRwDialog">
      <form class="form-grid" @submit.prevent="saveRw">
        <AppInfoNote v-if="!hamletOptions.length" title="Dusun belum tersedia" tone="warning">
          Tambahkan data Dusun terlebih dahulu sebelum membuat RW.
        </AppInfoNote>
        <AppSelect v-model="rwForm.hamletId" label="Dusun" :options="hamletOptions" required empty-hint="Belum ada Dusun. Buat Dusun dahulu." />
        <AppInput v-model="rwForm.name" label="Nama RW" required hint="Gunakan format singkat, contoh: RW 01." />
        <div class="inline-actions">
          <AppButton type="submit" :disabled="isAnyBusy">{{ isBusy('saveRw') ? 'Menyimpan...' : 'Simpan' }}</AppButton>
          <AppButton type="button" variant="secondary" :disabled="isAnyBusy" @click="closeRwDialog">Batal</AppButton>
        </div>
      </form>
    </AppDialog>

    <AppDialog :open="rtDialogOpen" :title="rtForm.id ? 'Edit RT' : 'Tambah RT'" @close="closeRtDialog">
      <form class="form-grid" @submit.prevent="saveRt">
        <AppInfoNote v-if="!rwOptions.length" title="RW belum tersedia" tone="warning">
          Tambahkan RW terlebih dahulu. RT harus punya induk RW agar laporan bisa difilter per wilayah.
        </AppInfoNote>
        <AppSelect v-model="rtForm.rwId" label="RW" :options="rwOptions" required empty-hint="Belum ada RW. Buat RW dahulu." />
        <AppInput v-model="rtForm.name" label="Nama RT" required hint="Gunakan format singkat, contoh: RT 03." />
        <div class="inline-actions">
          <AppButton type="submit" :disabled="isAnyBusy">{{ isBusy('saveRt') ? 'Menyimpan...' : 'Simpan' }}</AppButton>
          <AppButton type="button" variant="secondary" :disabled="isAnyBusy" @click="closeRtDialog">Batal</AppButton>
        </div>
      </form>
    </AppDialog>

    <AppDialog :open="posyanduDialogOpen" :title="posyanduForm.id ? 'Edit Posyandu' : 'Tambah Posyandu'" @close="closePosyanduDialog">
      <form class="form-grid" @submit.prevent="savePosyandu">
        <AppInfoNote v-if="!hamletOptions.length" title="Dusun belum tersedia" tone="warning">
          Posyandu harus ditempatkan pada Dusun. Buat Dusun terlebih dahulu.
        </AppInfoNote>
        <AppSelect v-model="posyanduForm.hamletId" label="Dusun" :options="hamletOptions" required empty-hint="Belum ada Dusun. Buat Dusun dahulu." />
        <AppInput v-model="posyanduForm.name" label="Nama Posyandu" required hint="Contoh: Posyandu Melati." />
        <AppInput v-model="posyanduForm.locationAddress" label="Alamat Lokasi" hint="Opsional, isi titik/lokasi kegiatan posyandu." />
        <AppInput v-model="posyanduForm.scheduleDay" label="Jadwal" hint="Opsional, contoh: Minggu ke-2 setiap bulan." />
        <AppInput v-model="posyanduForm.contactPhone" label="No Kontak" inputmode="tel" hint="Opsional, nomor kader/penanggung jawab." />
        <div class="inline-actions">
          <AppButton type="submit" :disabled="isAnyBusy">{{ isBusy('savePosyandu') ? 'Menyimpan...' : 'Simpan' }}</AppButton>
          <AppButton type="button" variant="secondary" :disabled="isAnyBusy" @click="closePosyanduDialog">Batal</AppButton>
        </div>
      </form>
    </AppDialog>
  </div>
</template>
