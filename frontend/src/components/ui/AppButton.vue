<script setup lang="ts">
defineProps<{
  label?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  block?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button :type="type || 'button'" class="app-button" :data-variant="variant || 'primary'" :data-block="block" :disabled="disabled">
    <slot>{{ label }}</slot>
  </button>
</template>

