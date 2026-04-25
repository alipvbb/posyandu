<template>
  <div class="form-grid">
    <AppCard>
      <strong>Pengaturan aplikasi</strong>
      <div class="form-grid" style="margin-top: 14px">
        <div>
          <strong>PWA siap di-install</strong>
          <p class="muted-text">Aplikasi dapat dipasang ke home screen smartphone untuk pengalaman seperti aplikasi Android native.</p>
        </div>
        <div>
          <strong>Mode offline</strong>
          <p class="muted-text">Draft input pemeriksaan disimpan lokal saat jaringan lemah atau terputus.</p>
        </div>
        <div>
          <strong>QR code kartu posyandu</strong>
          <p class="muted-text">Scan oleh petugas untuk buka detail balita, scan oleh orang tua untuk lihat tumbuh kembang publik.</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import AppCard from '../components/ui/AppCard.vue';
</script>

