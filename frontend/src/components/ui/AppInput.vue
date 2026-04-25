<script setup lang="ts">
defineProps<{
  modelValue?: string | number | null;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}>();

defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <label class="form-field">
    <span>{{ label }}</span>
    <input
      class="form-input"
      :type="type || 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue ?? ''"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

