<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
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
const open = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: '',
  email: '',
  password: 'password123',
  phone: '',
  status: 'ACTIVE',
  roleCodes: ['viewer'] as string[],
});

const load = async () => {
  const [userRes, roleRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
  users.value = userRes.data.data;
  roles.value = roleRes.data.data;
};

const reset = () => {
  editingId.value = null;
  form.name = '';
  form.email = '';
  form.password = 'password123';
  form.phone = '';
  form.status = 'ACTIVE';
  form.roleCodes = ['viewer'];
};

const save = async () => {
  try {
    const payload = {
      ...form,
      roleCodes: form.roleCodes,
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
  } catch (_error) {
    appStore.pushToast('Gagal menyimpan user.', 'error');
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
  open.value = true;
};

onMounted(load);
</script>

<template>
  <div class="form-grid">
    <div class="page-head">
      <div>
        <h2 style="margin: 0">Manajemen User</h2>
        <p class="muted-text" style="margin: 6px 0 0">Tambah, edit, aktif/nonaktifkan user, dan assign role.</p>
      </div>
      <AppButton @click="open = true">Tambah user</AppButton>
    </div>

    <AppCard>
      <DataTable
        :columns="[
          { key: 'name', label: 'Nama' },
          { key: 'email', label: 'Email' },
          { key: 'roles', label: 'Role' },
          { key: 'status', label: 'Status' },
          { key: 'aksi', label: 'Aksi' },
        ]"
        :rows="users"
      >
        <template #roles="{ row }">{{ row.roles.map((item: any) => item.name).join(', ') }}</template>
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
        </label>
        <div class="inline-actions">
          <AppButton type="submit">Simpan</AppButton>
          <AppButton variant="secondary" type="button" @click="open = false">Batal</AppButton>
        </div>
      </form>
    </AppDialog>
  </div>
</template>

