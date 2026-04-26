<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppInput from '../components/ui/AppInput.vue';
import { APP_NAME } from '../app/branding';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const registerForm = reactive({
  villageName: '',
  villageCode: '',
  adminName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
});

const verifyForm = reactive({
  email: '',
  code: '',
});

const registerResult = ref<null | { delivery: string; expiresInMinutes: number; debugCode?: string }>(null);
const showVerification = computed(() => Boolean(registerResult.value));

const submitRegister = async () => {
  if (registerForm.password !== registerForm.confirmPassword) {
    appStore.pushToast('Konfirmasi password tidak sama.', 'error');
    return;
  }

  try {
    const result = await authStore.register({
      villageName: registerForm.villageName,
      villageCode: registerForm.villageCode || undefined,
      adminName: registerForm.adminName,
      email: registerForm.email,
      phone: registerForm.phone || null,
      password: registerForm.password,
    });

    registerResult.value = {
      delivery: result.delivery,
      expiresInMinutes: result.expiresInMinutes,
      debugCode: result.debugCode,
    };
    verifyForm.email = result.email;
    appStore.pushToast('Registrasi berhasil. Cek email untuk kode verifikasi.', 'success');
  } catch (error: any) {
    appStore.pushToast(error.response?.data?.message || 'Registrasi gagal.', 'error');
  }
};

const submitVerify = async () => {
  try {
    await authStore.verifyRegister({
      email: verifyForm.email,
      code: verifyForm.code,
    });
    appStore.pushToast('Verifikasi berhasil. Selamat datang.', 'success');
    router.push('/');
  } catch (error: any) {
    appStore.pushToast(error.response?.data?.message || 'Verifikasi gagal.', 'error');
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-hero">
      <div>
        <div class="brand-mark">PA</div>
        <h1>{{ APP_NAME }}</h1>
        <p>Daftarkan desa Anda. Akun pendaftar otomatis menjadi Admin Desa setelah verifikasi email.</p>
      </div>

      <AppCard>
        <form v-if="!showVerification" class="form-grid" @submit.prevent="submitRegister">
          <div>
            <h2 style="margin: 0 0 6px">Registrasi Desa</h2>
            <p class="muted-text" style="margin: 0">Satu desa akan memiliki admin untuk mengelola user desa tersebut.</p>
          </div>

          <AppInput v-model="registerForm.villageName" label="Nama Desa" />
          <AppInput v-model="registerForm.villageCode" label="Kode Desa (opsional)" />
          <AppInput v-model="registerForm.adminName" label="Nama Admin Desa" />
          <AppInput v-model="registerForm.email" label="Email Admin" type="email" />
          <AppInput v-model="registerForm.phone" label="No HP (opsional)" />
          <AppInput v-model="registerForm.password" label="Password" type="password" />
          <AppInput v-model="registerForm.confirmPassword" label="Konfirmasi Password" type="password" />

          <AppButton type="submit" block :disabled="authStore.loading">
            {{ authStore.loading ? 'Memproses...' : 'Daftar & Kirim Kode Verifikasi' }}
          </AppButton>
          <AppButton type="button" variant="ghost" block @click="router.push('/login')">Kembali ke Login</AppButton>
        </form>

        <form v-else class="form-grid" @submit.prevent="submitVerify">
          <div>
            <h2 style="margin: 0 0 6px">Verifikasi Email</h2>
            <p class="muted-text" style="margin: 0">
              Kode verifikasi sudah dikirim ke email admin. Berlaku {{ registerResult?.expiresInMinutes }} menit.
            </p>
            <p v-if="registerResult?.delivery === 'mock' && registerResult?.debugCode" class="muted-text" style="margin: 6px 0 0">
              Mode dev (tanpa SMTP), kode: <strong>{{ registerResult.debugCode }}</strong>
            </p>
          </div>
          <AppInput v-model="verifyForm.email" label="Email" type="email" />
          <AppInput v-model="verifyForm.code" label="Kode Verifikasi" />
          <AppButton type="submit" block :disabled="authStore.loading">
            {{ authStore.loading ? 'Memverifikasi...' : 'Verifikasi & Masuk' }}
          </AppButton>
        </form>
      </AppCard>
    </div>
  </div>
</template>
