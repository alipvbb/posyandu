<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string;
    compact?: boolean;
  }>(),
  {
    text: 'Memuat data...',
    compact: false,
  },
);
</script>

<template>
  <div class="loading-block" :data-compact="compact ? 'true' : 'false'" role="status" aria-live="polite" aria-busy="true">
    <span class="loading-spinner" aria-hidden="true" />
    <span>{{ text }}</span>
  </div>
</template>
