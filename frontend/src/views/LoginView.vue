<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppInput from '../components/ui/AppInput.vue';
import { APP_NAME } from '../app/branding';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  email: 'admin@posyandu.local',
  password: 'password123',
});

const submit = async () => {
  try {
    await authStore.login(form);
    appStore.pushToast('Login berhasil.', 'success');
    router.push(String(route.query.redirect || '/'));
  } catch (error: any) {
    appStore.pushToast(error.response?.data?.message || 'Login gagal.', 'error');
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-hero">
      <div>
        <div class="brand-mark">PA</div>
        <h1>{{ APP_NAME }}</h1>
        <p>
          PWA untuk pemantauan pertumbuhan balita, deteksi risiko stunting, dan pencatatan pemeriksaan posyandu berbasis QR code.
        </p>
      </div>

      <AppCard>
        <form class="form-grid" @submit.prevent="submit">
          <div>
            <h2 style="margin: 0 0 6px">Masuk ke aplikasi</h2>
            <p class="muted-text" style="margin: 0">Gunakan akun petugas, kader, admin, atau kepala desa.</p>
          </div>
          <AppInput v-model="form.email" label="Email" type="email" />
          <AppInput v-model="form.password" label="Password" type="password" />
          <AppButton type="submit" block :disabled="authStore.loading">
            {{ authStore.loading ? 'Memproses...' : 'Login' }}
          </AppButton>
          <small class="muted-text">Akun default: `admin@posyandu.local` / `password123`</small>
        </form>
      </AppCard>
    </div>
  </div>
</template>
