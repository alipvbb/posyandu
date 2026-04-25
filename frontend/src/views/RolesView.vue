<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppLoadingBlock from '../components/ui/AppLoadingBlock.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import { api } from '../services/api';
import { useAppStore } from '../stores/app';
import { getHiddenBottomNavKeys, setHiddenBottomNavKeys } from '../utils/nav-access';

type RoleRecord = {
  id: number;
  code: string;
  name: string;
  permissions: Array<{ id: number; code: string; name: string }>;
};

type AccessRow = {
  key: string;
  title: string;
  path: string;
  description: string;
  permissionCode: string;
  bottomNav: boolean;
};

const PAGE_ACCESS_ROWS: AccessRow[] = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    path: '/',
    description: 'Akses halaman ringkasan dashboard.',
    permissionCode: 'dashboard.view',
    bottomNav: true,
  },
  {
    key: 'toddlers',
    title: 'Data Balita',
    path: '/balita',
    description: 'Akses halaman daftar dan pencarian balita.',
    permissionCode: 'toddlers.view',
    bottomNav: true,
  },
  {
    key: 'toddler-create',
    title: 'Tambah Balita',
    path: '/balita/tambah',
    description: 'Akses halaman input data balita baru.',
    permissionCode: 'toddlers.create',
    bottomNav: false,
  },
  {
    key: 'checkup-create',
    title: 'Input Pemeriksaan',
    path: '/balita/:id/pemeriksaan',
    description: 'Akses halaman input pemeriksaan posyandu.',
    permissionCode: 'checkups.create',
    bottomNav: false,
  },
  {
    key: 'monthly-checkups',
    title: 'Pemeriksaan Bulanan',
    path: '/pemeriksaan-bulanan',
    description: 'Akses halaman pemeriksaan by month, hadir/tidak hadir, dan input via search/scan QR.',
    permissionCode: 'checkups.view',
    bottomNav: true,
  },
  {
    key: 'checkup-edit',
    title: 'Edit Pemeriksaan',
    path: '/balita/:id/pemeriksaan/:checkupId/edit',
    description: 'Akses halaman edit riwayat pemeriksaan balita.',
    permissionCode: 'checkups.update',
    bottomNav: false,
  },
  {
    key: 'scan-qr',
    title: 'Scan QR',
    path: '/scan-qr',
    description: 'Akses scanner QR kartu posyandu.',
    permissionCode: 'qrcode.scan',
    bottomNav: true,
  },
  {
    key: 'cards-generate',
    title: 'Kartu Posyandu',
    path: '/kartu/:id',
    description: 'Akses halaman kartu posyandu dan cetak kartu.',
    permissionCode: 'cards.generate',
    bottomNav: false,
  },
  {
    key: 'reports',
    title: 'Laporan',
    path: '/laporan',
    description: 'Akses halaman rekap laporan dan statistik.',
    permissionCode: 'reports.view',
    bottomNav: true,
  },
  {
    key: 'users',
    title: 'Manajemen User',
    path: '/users',
    description: 'Akses pengelolaan user dan status user.',
    permissionCode: 'users.manage',
    bottomNav: false,
  },
  {
    key: 'families-master',
    title: 'Master Kartu Keluarga',
    path: '/master-keluarga',
    description: 'Akses pengelolaan master KK (data utama keluarga).',
    permissionCode: 'toddlers.create',
    bottomNav: false,
  },
  {
    key: 'roles',
    title: 'Role & Permission',
    path: '/roles',
    description: 'Akses pengaturan role dan permission.',
    permissionCode: 'roles.manage',
    bottomNav: false,
  },
  {
    key: 'settings',
    title: 'Pengaturan',
    path: '/pengaturan',
    description: 'Akses pengaturan aplikasi.',
    permissionCode: 'settings.manage',
    bottomNav: false,
  },
];

const appStore = useAppStore();
const roles = ref<RoleRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const selectedRoleId = ref('');
const draftPermissionCodes = ref<string[]>([]);
const draftHiddenBottomNavKeys = ref<string[]>([]);

const selectedRole = computed(() => roles.value.find((item) => String(item.id) === selectedRoleId.value) || null);

const roleOptions = computed(() =>
  roles.value.map((item) => ({
    label: `${item.name} (${item.code})`,
    value: String(item.id),
  })),
);

const canAccess = (row: AccessRow) => draftPermissionCodes.value.includes(row.permissionCode);

const isBottomNavHidden = (rowKey: string) => draftHiddenBottomNavKeys.value.includes(rowKey);

const onAccessChange = (row: AccessRow, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  const current = new Set(draftPermissionCodes.value);
  if (checked) current.add(row.permissionCode);
  else current.delete(row.permissionCode);
  draftPermissionCodes.value = [...current];

  if (!checked && row.bottomNav) {
    draftHiddenBottomNavKeys.value = draftHiddenBottomNavKeys.value.filter((key) => key !== row.key);
  }
};

const onBottomNavChange = (row: AccessRow, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  const current = new Set(draftHiddenBottomNavKeys.value);
  if (checked) current.add(row.key);
  else current.delete(row.key);
  draftHiddenBottomNavKeys.value = [...current];
};

const hydrateDraft = () => {
  if (!selectedRole.value) return;
  draftPermissionCodes.value = selectedRole.value.permissions.map((item) => item.code);
  draftHiddenBottomNavKeys.value = getHiddenBottomNavKeys(selectedRole.value.code);
};

const load = async () => {
  loading.value = true;
  try {
    const roleRes = await api.get('/roles');
    roles.value = roleRes.data.data;
    if (!roles.value.length) {
      selectedRoleId.value = '';
      return;
    }

    if (!selectedRoleId.value || !roles.value.some((item) => String(item.id) === selectedRoleId.value)) {
      const adminRole = roles.value.find((item) => item.code === 'admin');
      selectedRoleId.value = String(adminRole?.id || roles.value[0].id);
    }
  } catch (_error) {
    appStore.pushToast('Gagal memuat data role.', 'error');
  } finally {
    loading.value = false;
  }
};

const saveAccess = async () => {
  if (!selectedRole.value) return;
  saving.value = true;
  try {
    await api.put(`/roles/${selectedRole.value.id}/permissions`, {
      permissionCodes: [...new Set(draftPermissionCodes.value)],
    });
    setHiddenBottomNavKeys(selectedRole.value.code, draftHiddenBottomNavKeys.value);
    appStore.pushToast('Hak akses berhasil disimpan.', 'success');
    await load();
  } catch (_error) {
    appStore.pushToast('Gagal menyimpan hak akses.', 'error');
  } finally {
    saving.value = false;
  }
};

watch(selectedRole, () => {
  hydrateDraft();
});

onMounted(load);
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Hak Akses Halaman</h2>
        <p class="muted-text" style="margin: 6px 0 0">
          Role:
          <strong>{{ selectedRole?.code || '-' }}</strong>
          • atur akses halaman dan visibilitas menu bawah.
        </p>
      </div>
      <div class="inline-actions">
        <AppSelect v-model="selectedRoleId" label="Pilih role" :options="roleOptions" />
        <AppButton :disabled="!selectedRole || saving" @click="saveAccess">
          {{ saving ? 'Menyimpan...' : 'Simpan Akses' }}
        </AppButton>
      </div>
    </div>

    <AppCard v-if="loading">
      <AppLoadingBlock text="Memuat pengaturan hak akses..." />
    </AppCard>

    <AppCard v-else-if="!selectedRole">
      <p class="muted-text">Role tidak ditemukan.</p>
    </AppCard>

    <AppCard v-else>
      <div class="table-wrap">
        <table class="data-table access-table">
          <thead>
            <tr>
              <th>Halaman</th>
              <th>Path</th>
              <th>Deskripsi</th>
              <th>Akses</th>
              <th>Bottom Nav</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in PAGE_ACCESS_ROWS" :key="row.key">
              <td data-label="Halaman">
                <strong>{{ row.title }}</strong>
              </td>
              <td data-label="Path">
                <code>{{ row.path }}</code>
              </td>
              <td data-label="Deskripsi">{{ row.description }}</td>
              <td data-label="Akses">
                <label class="access-check">
                  <input :checked="canAccess(row)" type="checkbox" @change="onAccessChange(row, $event)" />
                  <span>{{ canAccess(row) ? 'Diizinkan' : 'Ditolak' }}</span>
                </label>
              </td>
              <td data-label="Bottom Nav">
                <label v-if="row.bottomNav" class="access-check">
                  <input
                    :checked="isBottomNavHidden(row.key)"
                    :disabled="!canAccess(row)"
                    type="checkbox"
                    @change="onBottomNavChange(row, $event)"
                  />
                  <span>Sembunyi</span>
                </label>
                <span v-else class="muted-text">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
