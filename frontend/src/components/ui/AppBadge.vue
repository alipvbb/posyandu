<script setup lang="ts">
defineProps<{
  tone?: 'green' | 'yellow' | 'orange' | 'red' | 'blue';
}>();
</script>

<template>
  <span class="status-badge" :data-tone="tone || 'blue'"><slot /></span>
</template>

