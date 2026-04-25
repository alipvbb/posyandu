<script setup lang="ts">
import { APP_NAME } from '../../app/branding';

withDefaults(
  defineProps<{
    show: boolean;
    text?: string;
  }>(),
  {
    text: `Memuat aplikasi ${APP_NAME}...`,
  },
);
</script>

<template>
  <Transition name="loading-fade">
    <div v-if="show" class="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div class="loading-overlay-card">
        <span class="loading-spinner" aria-hidden="true" />
        <strong>{{ text }}</strong>
      </div>
    </div>
  </Transition>
</template>
