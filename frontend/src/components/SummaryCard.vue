<script setup lang="ts">
import AppCard from './ui/AppCard.vue';

defineProps<{
  title: string;
  value: string | number;
  caption?: string;
}>();
</script>

<template>
  <AppCard>
    <div class="summary-card">
      <span>{{ title }}</span>
      <strong>{{ value }}</strong>
      <small>{{ caption }}</small>
    </div>
  </AppCard>
</template>

