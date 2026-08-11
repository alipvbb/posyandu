<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    tone?: 'info' | 'warning' | 'success';
  }>(),
  {
    title: '',
    tone: 'info',
  },
);
</script>

<template>
  <div class="info-note" :data-tone="tone">
    <strong v-if="title">{{ title }}</strong>
    <p>
      <slot />
    </p>
  </div>
</template>
