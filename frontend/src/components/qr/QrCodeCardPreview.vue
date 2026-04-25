<script setup lang="ts">
defineProps<{
  image: string;
  value?: string;
  title?: string;
  showValue?: boolean;
}>();
</script>

<template>
  <div class="qr-card">
    <strong>{{ title || 'QR Kartu Posyandu' }}</strong>
    <img :src="image" alt="QR Code Posyandu" class="qr-image" />
    <small v-if="showValue !== false">{{ value }}</small>
  </div>
</template>
