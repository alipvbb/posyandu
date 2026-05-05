<script setup lang="ts">
import { onBeforeUnmount, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';
import AppDialog from '../components/ui/AppDialog.vue';
import AppInput from '../components/ui/AppInput.vue';
import { APP_NAME } from '../app/branding';
import { authService } from '../services/auth.service';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const forgotDialogOpen = reactive({ open: false });
const forgotLoading = reactive({ request: false, reset: false });
const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});
const forgotState = reactive({
  step: 1 as 1 | 2,
});
const verifyDialogOpen = reactive({ open: false });
const verifyLoading = reactive({ verify: false, resend: false });
const verifyForm = reactive({
  email: '',
  code: '',
});
const verifyResult = reactive({
  expiresInMinutes: 0,
  cooldownSeconds: 0,
  delivery: '',
  debugCode: '',
});
let verifyCooldownTimer: number | null = null;

const stopVerifyCooldown = () => {
  if (verifyCooldownTimer) {
    window.clearInterval(verifyCooldownTimer);
    verifyCooldownTimer = null;
  }
};

const startVerifyCooldown = (seconds: number) => {
  stopVerifyCooldown();
  verifyResult.cooldownSeconds = seconds;
  verifyCooldownTimer = window.setInterval(() => {
    verifyResult.cooldownSeconds = Math.max(0, verifyResult.cooldownSeconds - 1);
    if (verifyResult.cooldownSeconds === 0) {
      stopVerifyCooldown();
    }
  }, 1000);
};

const submit = async () => {
  try {
    await authStore.login(form);
    appStore.pushToast('Login berhasil.', 'success');
    router.push(String(route.query.redirect || '/'));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login gagal.';
    appStore.pushToast(message, 'error');
    if (String(message).toLowerCase().includes('belum aktif')) {
      openVerifyEmail();
    }
  }
};

const openForgotPassword = () => {
  forgotDialogOpen.open = true;
  forgotState.step = 1;
  forgotLoading.request = false;
  forgotLoading.reset = false;
  forgotForm.email = form.email || '';
  forgotForm.code = '';
  forgotForm.newPassword = '';
  forgotForm.confirmPassword = '';
};

const openVerifyEmail = () => {
  verifyDialogOpen.open = true;
  verifyLoading.verify = false;
  verifyLoading.resend = false;
  verifyForm.email = form.email || verifyForm.email || '';
  verifyForm.code = '';
  verifyResult.expiresInMinutes = 0;
  verifyResult.delivery = '';
  verifyResult.debugCode = '';
};

const closeVerifyEmail = () => {
  verifyDialogOpen.open = false;
  stopVerifyCooldown();
};

const resendVerificationCode = async () => {
  if (!verifyForm.email) {
    appStore.pushToast('Masukkan email akun terlebih dahulu.', 'error');
    return;
  }

  try {
    verifyLoading.resend = true;
    const result = await authStore.resendRegisterCode({ email: verifyForm.email });
    verifyResult.expiresInMinutes = result.expiresInMinutes;
    verifyResult.delivery = result.delivery;
    verifyResult.debugCode = result.debugCode || '';
    startVerifyCooldown(result.cooldownSeconds || 60);
    appStore.pushToast('Kode verifikasi baru sudah dikirim ke email.', 'success');
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal mengirim ulang kode verifikasi.', 'error');
  } finally {
    verifyLoading.resend = false;
  }
};

const submitVerifyEmail = async () => {
  if (!verifyForm.email || !verifyForm.code) {
    appStore.pushToast('Lengkapi email dan kode verifikasi.', 'error');
    return;
  }

  try {
    verifyLoading.verify = true;
    await authStore.verifyRegister({
      email: verifyForm.email,
      code: verifyForm.code,
    });
    appStore.pushToast('Verifikasi berhasil. Selamat datang.', 'success');
    closeVerifyEmail();
    router.push(String(route.query.redirect || '/'));
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Verifikasi gagal.', 'error');
  } finally {
    verifyLoading.verify = false;
  }
};

const sendForgotCode = async () => {
  if (!forgotForm.email) {
    appStore.pushToast('Masukkan email akun terlebih dahulu.', 'error');
    return;
  }
  try {
    forgotLoading.request = true;
    const result = await authService.forgotPassword({ email: forgotForm.email });
    forgotState.step = 2;
    appStore.pushToast(result.message || 'Kode reset password telah dikirim.', 'success');
    if (result.debugCode) {
      appStore.pushToast(`Kode debug: ${result.debugCode}`, 'info');
    }
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Gagal mengirim kode reset password.', 'error');
  } finally {
    forgotLoading.request = false;
  }
};

const submitResetPassword = async () => {
  if (!forgotForm.code || !forgotForm.newPassword || !forgotForm.confirmPassword) {
    appStore.pushToast('Lengkapi kode dan password baru.', 'error');
    return;
  }
  try {
    forgotLoading.reset = true;
    const result = await authService.resetPassword({
      email: forgotForm.email,
      code: forgotForm.code,
      newPassword: forgotForm.newPassword,
      confirmPassword: forgotForm.confirmPassword,
    });
    appStore.pushToast(result.message || 'Password berhasil direset.', 'success');
    forgotDialogOpen.open = false;
  } catch (error: any) {
    appStore.pushToast(error?.response?.data?.message || 'Reset password gagal.', 'error');
  } finally {
    forgotLoading.reset = false;
  }
};

onBeforeUnmount(() => {
  stopVerifyCooldown();
});
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
          <div class="inline-actions" style="justify-content: flex-end">
            <button class="ghost-button" type="button" @click="openForgotPassword">Lupa password?</button>
          </div>
          <AppButton type="submit" block :disabled="authStore.loading">
            {{ authStore.loading ? 'Memproses...' : 'Login' }}
          </AppButton>
          <AppButton type="button" variant="secondary" block @click="openVerifyEmail">Verifikasi Email / Kirim Ulang OTP</AppButton>
          <AppButton type="button" variant="ghost" block @click="router.push('/register')">Daftar Admin Desa</AppButton>
        </form>
      </AppCard>
    </div>

    <AppDialog :open="forgotDialogOpen.open" title="Lupa Password" @close="forgotDialogOpen.open = false">
      <form v-if="forgotState.step === 1" class="form-grid" @submit.prevent="sendForgotCode">
        <p class="muted-text" style="margin: 0">
          Masukkan email akun Anda. Kami akan kirim kode verifikasi reset password.
        </p>
        <AppInput v-model="forgotForm.email" label="Email akun" type="email" />
        <div class="inline-actions">
          <AppButton type="submit" :disabled="forgotLoading.request">
            {{ forgotLoading.request ? 'Mengirim...' : 'Kirim Kode' }}
          </AppButton>
          <AppButton type="button" variant="secondary" @click="forgotDialogOpen.open = false">Batal</AppButton>
        </div>
      </form>

      <form v-else class="form-grid" @submit.prevent="submitResetPassword">
        <p class="muted-text" style="margin: 0">
          Kode verifikasi sudah dikirim ke email. Isi kode dan password baru Anda.
        </p>
        <AppInput v-model="forgotForm.email" label="Email akun" type="email" />
        <AppInput v-model="forgotForm.code" label="Kode verifikasi" />
        <AppInput v-model="forgotForm.newPassword" label="Password baru" type="password" />
        <AppInput v-model="forgotForm.confirmPassword" label="Konfirmasi password baru" type="password" />
        <div class="inline-actions">
          <AppButton type="submit" :disabled="forgotLoading.reset">
            {{ forgotLoading.reset ? 'Memproses...' : 'Reset Password' }}
          </AppButton>
          <AppButton type="button" variant="secondary" @click="forgotState.step = 1">Kirim ulang kode</AppButton>
        </div>
      </form>
    </AppDialog>

    <AppDialog :open="verifyDialogOpen.open" title="Verifikasi Email" @close="closeVerifyEmail">
      <form class="form-grid" @submit.prevent="submitVerifyEmail">
        <p class="muted-text" style="margin: 0">
          Jika akun sudah terdaftar tetapi belum aktif, kirim ulang OTP lalu masukkan kode verifikasi dari email.
        </p>
        <AppInput v-model="verifyForm.email" label="Email akun" type="email" />
        <AppInput v-model="verifyForm.code" label="Kode OTP / Verifikasi" />
        <p v-if="verifyResult.expiresInMinutes" class="muted-text" style="margin: 0">
          Kode baru berlaku {{ verifyResult.expiresInMinutes }} menit. Cek Inbox atau Spam.
        </p>
        <p v-if="verifyResult.delivery === 'mock' && verifyResult.debugCode" class="muted-text" style="margin: 0">
          Mode dev, kode: <strong>{{ verifyResult.debugCode }}</strong>
        </p>
        <div class="inline-actions">
          <AppButton type="submit" :disabled="verifyLoading.verify">
            {{ verifyLoading.verify ? 'Memverifikasi...' : 'Verifikasi & Masuk' }}
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            :disabled="verifyLoading.resend || verifyResult.cooldownSeconds > 0"
            @click="resendVerificationCode"
          >
            {{
              verifyResult.cooldownSeconds > 0
                ? `Kirim ulang ${verifyResult.cooldownSeconds} dtk`
                : verifyLoading.resend
                  ? 'Mengirim...'
                  : 'Kirim Ulang OTP'
            }}
          </AppButton>
        </div>
      </form>
    </AppDialog>
  </div>
</template>
