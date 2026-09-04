<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppButton from '../components/ui/AppButton.vue';
import AppCard from '../components/ui/AppCard.vue';

const router = useRouter();
</script>

<template>
  <div class="form-grid">
    <AppCard>
      <div class="access-denied">
        <div class="access-denied__mark">!</div>
        <h2>Akses belum diizinkan</h2>
        <p class="muted-text">
          Akun Anda berhasil login, tetapi belum memiliki hak akses untuk halaman ini.
          Minta Admin Desa membuka menu Manajemen User lalu lengkapi hak akses halaman Anda.
        </p>
        <div class="inline-actions access-denied__actions">
          <AppButton @click="router.push('/profil')">Buka Profil</AppButton>
          <AppButton variant="secondary" @click="router.push('/login')">Kembali ke Login</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.access-denied {
  display: grid;
  gap: 12px;
  justify-items: start;
  padding: 8px;
}

.access-denied__mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 999px;
  background: #fff0d9;
  color: #b56b00;
  font-size: 1.4rem;
  font-weight: 900;
}

.access-denied h2 {
  margin: 0;
}

.access-denied__actions {
  margin-top: 6px;
}
</style>
