<script setup lang="ts">
import { reactive } from 'vue';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppInput from '../components/ui/AppInput.vue';
import { authService } from '../services/auth.service';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const appStore = useAppStore();
const form = reactive({
  currentPassword: '',
  newPassword: '',
});

const submit = async () => {
  try {
    await authService.changePassword(form);
    form.currentPassword = '';
    form.newPassword = '';
    appStore.pushToast('Password berhasil diubah.', 'success');
  } catch (_error) {
    appStore.pushToast('Gagal mengubah password.', 'error');
  }
};
</script>

<template>
  <div class="form-grid">
    <AppCard>
      <strong>Profil user</strong>
      <div class="form-grid" style="margin-top: 14px">
        <div>Nama: <strong>{{ authStore.user?.name }}</strong></div>
        <div>Email: <strong>{{ authStore.user?.email }}</strong></div>
        <div>Role: <strong>{{ authStore.user?.roles?.map((item) => item.name).join(', ') }}</strong></div>
      </div>
    </AppCard>

    <AppCard>
      <strong>Ubah password</strong>
      <form class="form-grid" style="margin-top: 14px" @submit.prevent="submit">
        <AppInput v-model="form.currentPassword" label="Password saat ini" type="password" />
        <AppInput v-model="form.newPassword" label="Password baru" type="password" />
        <AppButton type="submit">Simpan password</AppButton>
      </form>
    </AppCard>
  </div>
</template>

