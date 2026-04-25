<template>
  <div class="login-page">
    <AppCard>
      <div class="form-grid" style="text-align: center">
        <h1 style="margin: 0">404</h1>
        <p class="muted-text">Halaman tidak ditemukan atau Anda tidak memiliki akses.</p>
        <RouterLink to="/" class="app-button">Kembali ke dashboard</RouterLink>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import AppCard from '../components/ui/AppCard.vue';
</script>

