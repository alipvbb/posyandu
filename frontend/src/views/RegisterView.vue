<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppInfoNote from '../components/ui/AppInfoNote.vue';
import AppInput from '../components/ui/AppInput.vue';
import { APP_NAME } from '../app/branding';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { extractApiErrorMessage } from '../utils/feedback';

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
const resendCooldown = ref(0);
let resendTimer: number | null = null;

const stopResendTimer = () => {
  if (resendTimer) {
    window.clearInterval(resendTimer);
    resendTimer = null;
  }
};

const startResendCooldown = (seconds: number) => {
  stopResendTimer();
  resendCooldown.value = seconds;
  resendTimer = window.setInterval(() => {
    resendCooldown.value = Math.max(0, resendCooldown.value - 1);
    if (resendCooldown.value === 0) {
      stopResendTimer();
    }
  }, 1000);
};

const submitRegister = async () => {
  if (!registerForm.villageName.trim() || !registerForm.adminName.trim() || !registerForm.email.trim() || !registerForm.password) {
    appStore.pushToast('Lengkapi Nama Desa, Nama Admin, Email Admin, dan Password terlebih dahulu.', 'error');
    return;
  }

  if (registerForm.password.length < 8) {
    appStore.pushToast('Password minimal 8 karakter agar akun admin lebih aman.', 'error');
    return;
  }

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
    startResendCooldown(60);
    appStore.pushToast('Registrasi berhasil. Cek email untuk kode verifikasi.', 'success');
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Registrasi gagal. Periksa data dan coba lagi.'), 'error');
  }
};

const submitVerify = async () => {
  if (!verifyForm.email.trim() || !verifyForm.code.trim()) {
    appStore.pushToast('Lengkapi email dan kode verifikasi dari email.', 'error');
    return;
  }

  try {
    await authStore.verifyRegister({
      email: verifyForm.email,
      code: verifyForm.code,
    });
    appStore.pushToast('Verifikasi berhasil. Selamat datang.', 'success');
    router.push('/');
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Verifikasi gagal. Pastikan kode masih berlaku.'), 'error');
  }
};

const resendCode = async () => {
  if (!verifyForm.email.trim()) {
    appStore.pushToast('Masukkan email admin terlebih dahulu untuk kirim ulang kode.', 'error');
    return;
  }

  try {
    const result = await authStore.resendRegisterCode({ email: verifyForm.email });
    registerResult.value = {
      delivery: result.delivery,
      expiresInMinutes: result.expiresInMinutes,
      debugCode: result.debugCode,
    };
    startResendCooldown(result.cooldownSeconds || 60);
    appStore.pushToast('Kode verifikasi baru sudah dikirim.', 'success');
  } catch (error: any) {
    appStore.pushToast(extractApiErrorMessage(error, 'Gagal kirim ulang kode verifikasi.'), 'error');
  }
};

onBeforeUnmount(() => {
  stopResendTimer();
});
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

          <AppInfoNote title="Alur registrasi">
            Setelah daftar, sistem mengirim kode OTP ke email admin. Jika belum masuk, cek folder Spam/Promosi lalu gunakan tombol kirim ulang.
          </AppInfoNote>

          <AppInput v-model="registerForm.villageName" label="Nama Desa" required hint="Contoh: Desa Brangkal." />
          <AppInput v-model="registerForm.villageCode" label="Kode Desa (opsional)" hint="Boleh dikosongkan jika belum punya kode internal desa." />
          <AppInput v-model="registerForm.adminName" label="Nama Admin Desa" required hint="Nama orang yang akan mengelola user desa ini." />
          <AppInput v-model="registerForm.email" label="Email Admin" type="email" required hint="Kode verifikasi akan dikirim ke email ini." />
          <AppInput v-model="registerForm.phone" label="No HP (opsional)" inputmode="tel" hint="Dipakai untuk kontak admin jika diperlukan." />
          <AppInput v-model="registerForm.password" label="Password" type="password" required hint="Minimal 8 karakter." />
          <AppInput v-model="registerForm.confirmPassword" label="Konfirmasi Password" type="password" required />

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
          <AppInput v-model="verifyForm.code" label="Kode Verifikasi" required hint="Masukkan kode OTP dari email. Jangan pakai spasi." />
          <AppButton type="submit" block :disabled="authStore.loading">
            {{ authStore.loading ? 'Memverifikasi...' : 'Verifikasi & Masuk' }}
          </AppButton>
          <AppButton type="button" variant="secondary" block :disabled="authStore.loading || resendCooldown > 0" @click="resendCode">
            {{ resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown} dtk` : 'Kirim Ulang Kode' }}
          </AppButton>
        </form>
      </AppCard>
    </div>
  </div>
</template>
