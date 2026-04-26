<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppSelect from '../components/ui/AppSelect.vue';
import DataTable from '../components/DataTable.vue';
import { api } from '../services/api';
import { useAppStore } from '../stores/app';

const appStore = useAppStore();
const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const permissions = ref<any[]>([]);
const open = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: '',
  email: '',
  password: 'password123',
  phone: '',
  status: 'ACTIVE',
  roleCodes: ['viewer'] as string[],
  useCustomPermissions: false,
  customPermissionCodes: [] as string[],
});

const pageByPermissionCode: Record<string, { page: string; path: string; description: string }> = {
  'dashboard.view': { page: 'Dashboard', path: '/', description: 'Akses ringkasan dashboard' },
  'toddlers.view': { page: 'Data Balita', path: '/balita', description: 'Lihat daftar dan detail balita' },
  'toddlers.create': { page: 'Tambah Balita', path: '/balita/tambah', description: 'Tambah data balita baru' },
  'toddlers.update': { page: 'Edit Balita', path: '/balita/:id/edit', description: 'Ubah data balita' },
  'toddlers.delete': { page: 'Hapus Balita', path: '/balita', description: 'Hapus data balita' },
  'checkups.view': { page: 'Pemeriksaan', path: '/pemeriksaan-bulanan', description: 'Lihat histori pemeriksaan' },
  'checkups.create': { page: 'Input Pemeriksaan', path: '/balita/:id/pemeriksaan', description: 'Input pemeriksaan baru' },
  'checkups.update': { page: 'Edit Pemeriksaan', path: '/balita/:id/pemeriksaan/:checkupId/edit', description: 'Edit riwayat pemeriksaan' },
  'checkups.delete': { page: 'Hapus Pemeriksaan', path: '/pemeriksaan-bulanan', description: 'Hapus data pemeriksaan' },
  'qrcode.scan': { page: 'Scan QR', path: '/scan-qr', description: 'Akses scanner QR balita' },
  'cards.generate': { page: 'Kartu Posyandu', path: '/kartu/:id', description: 'Generate/cetak kartu posyandu' },
  'reports.view': { page: 'Laporan', path: '/laporan', description: 'Lihat laporan dan grafik' },
  'reports.export': { page: 'Export Laporan', path: '/laporan', description: 'Download PDF/Excel/CSV laporan' },
  'users.manage': { page: 'Manajemen User', path: '/users', description: 'Tambah/edit user desa' },
  'roles.manage': { page: 'Role & Permission', path: '/roles', description: 'Atur role dan permission global' },
  'settings.manage': { page: 'Pengaturan', path: '/pengaturan', description: 'Kelola master data desa' },
  'audit.view': { page: 'Audit Log', path: '/dashboard', description: 'Lihat aktivitas user di sistem' },
};

const permissionRows = computed(() =>
  permissions.value
    .map((permission) => {
      const mapped = pageByPermissionCode[permission.code];
      return {
        ...permission,
        page: mapped?.page || permission.name,
        path: mapped?.path || '-',
        description: mapped?.description || permission.description || '-',
      };
    })
    .sort((a, b) => a.page.localeCompare(b.page, 'id')),
);

const load = async () => {
  const [userRes, roleRes, permissionRes] = await Promise.all([api.get('/users'), api.get('/roles'), api.get('/permissions')]);
  users.value = userRes.data.data;
  roles.value = roleRes.data.data;
  permissions.value = permissionRes.data.data;
};

const reset = () => {
  editingId.value = null;
  form.name = '';
  form.email = '';
  form.password = 'password123';
  form.phone = '';
  form.status = 'ACTIVE';
  form.roleCodes = ['viewer'];
  form.useCustomPermissions = false;
  form.customPermissionCodes = [];
};

const setCustomPermission = (permissionCode: string, allowed: boolean) => {
  if (allowed) {
    if (!form.customPermissionCodes.includes(permissionCode)) {
      form.customPermissionCodes.push(permissionCode);
    }
    return;
  }
  form.customPermissionCodes = form.customPermissionCodes.filter((code) => code !== permissionCode);
};

const isPermissionChecked = (permissionCode: string) => form.customPermissionCodes.includes(permissionCode);

const save = async () => {
  try {
    const payload = {
      ...form,
      roleCodes: form.roleCodes,
      useCustomPermissions: form.useCustomPermissions,
      customPermissionCodes: [...form.customPermissionCodes].sort(),
    };
    if (editingId.value) {
      await api.put(`/users/${editingId.value}`, payload);
    } else {
      await api.post('/users', payload);
    }
    appStore.pushToast('User berhasil disimpan.', 'success');
    open.value = false;
    reset();
    await load();
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal menyimpan user.', 'error');
  }
};

const editUser = (user: any) => {
  editingId.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.phone = user.phone || '';
  form.password = 'password123';
  form.status = user.status;
  form.roleCodes = user.roles.map((item: any) => item.code);
  form.useCustomPermissions = Boolean(user.useCustomPermissions);
  form.customPermissionCodes = Array.isArray(user.customPermissionCodes) ? [...user.customPermissionCodes] : [];
  open.value = true;
};

onMounted(load);
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Manajemen User</h2>
        <p class="muted-text" style="margin: 6px 0 0">
          Tambah, edit, aktif/nonaktifkan user, assign role, dan atur hak akses per user.
        </p>
      </div>
      <AppButton @click="open = true">Tambah user</AppButton>
    </div>

    <AppCard>
      <DataTable
        :columns="[
          { key: 'name', label: 'Nama' },
          { key: 'email', label: 'Email' },
          { key: 'village', label: 'Desa' },
          { key: 'roles', label: 'Role' },
          { key: 'accessMode', label: 'Akses' },
          { key: 'status', label: 'Status' },
          { key: 'aksi', label: 'Aksi' },
        ]"
        :rows="users"
      >
        <template #village="{ row }">{{ row.village?.name || '-' }}</template>
        <template #roles="{ row }">{{ row.roles.map((item: any) => item.name).join(', ') }}</template>
        <template #accessMode="{ row }">
          <span v-if="row.useCustomPermissions">Kustom ({{ row.customPermissionCodes?.length || 0 }})</span>
          <span v-else>Ikuti Role</span>
        </template>
        <template #aksi="{ row }">
          <button class="ghost-button" type="button" @click="editUser(row)">Edit</button>
        </template>
      </DataTable>
    </AppCard>

    <AppDialog :open="open" :title="editingId ? 'Edit User' : 'Tambah User'" @close="open = false">
      <form class="form-grid" @submit.prevent="save">
        <AppInput v-model="form.name" label="Nama" />
        <AppInput v-model="form.email" label="Email" type="email" />
        <AppInput v-model="form.password" label="Password" type="password" />
        <AppInput v-model="form.phone" label="No HP" />
        <AppSelect
          v-model="form.status"
          label="Status"
          :options="[
            { label: 'Aktif', value: 'ACTIVE' },
            { label: 'Nonaktif', value: 'INACTIVE' },
          ]"
        />
        <label class="form-field">
          <span>Role</span>
          <select v-model="form.roleCodes" class="form-input" multiple size="5">
            <option v-for="item in roles" :key="item.code" :value="item.code">{{ item.name }}</option>
          </select>
          <small class="muted-text">Role tetap disimpan. Jika akses kustom aktif, hak akses mengikuti pengaturan kustom.</small>
        </label>

        <label class="form-field">
          <span>Mode Hak Akses</span>
          <label class="access-check">
            <input
              type="checkbox"
              :checked="form.useCustomPermissions"
              @change="form.useCustomPermissions = ($event.target as HTMLInputElement).checked"
            />
            <span>Gunakan hak akses kustom per user</span>
          </label>
        </label>

        <div v-if="form.useCustomPermissions" class="access-permission-panel">
          <div class="access-table-head">
            <strong>Hak Akses Halaman</strong>
            <small class="muted-text">Centang halaman/permission yang boleh diakses user ini.</small>
          </div>
          <div class="access-permission-table">
            <div class="access-permission-row access-permission-row--head">
              <div>Halaman</div>
              <div>Path</div>
              <div>Deskripsi</div>
              <div>Akses</div>
            </div>
            <div v-for="permission in permissionRows" :key="permission.code" class="access-permission-row">
              <div>
                <strong>{{ permission.page }}</strong>
                <small class="muted-text">{{ permission.code }}</small>
              </div>
              <div><code>{{ permission.path }}</code></div>
              <div class="muted-text">{{ permission.description }}</div>
              <div>
                <label class="access-check">
                  <input
                    type="checkbox"
                    :checked="isPermissionChecked(permission.code)"
                    @change="setCustomPermission(permission.code, ($event.target as HTMLInputElement).checked)"
                  />
                  <span>Diizinkan</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="inline-actions">
          <AppButton type="submit">Simpan</AppButton>
          <AppButton variant="secondary" type="button" @click="open = false">Batal</AppButton>
        </div>
      </form>
    </AppDialog>
  </div>
</template>

<style scoped>
.access-permission-panel {
  border: 1px solid #dce9e2;
  border-radius: 16px;
  background: #fbfdfc;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.access-table-head {
  display: grid;
  gap: 2px;
}

.access-permission-table {
  border: 1px solid #e1ece6;
  border-radius: 12px;
  overflow: auto;
}

.access-permission-row {
  display: grid;
  grid-template-columns: minmax(170px, 1.2fr) minmax(120px, 0.8fr) minmax(240px, 1.6fr) minmax(120px, 0.8fr);
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #ebf2ee;
}

.access-permission-row > * {
  min-width: 0;
}

.access-permission-row--head {
  background: #f2f7f4;
  color: #607d71;
  font-weight: 700;
}

.access-permission-row:last-child {
  border-bottom: 0;
}

.access-permission-row code {
  background: #eef5f1;
  color: #35574a;
  padding: 3px 6px;
  border-radius: 8px;
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .access-permission-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
