<script setup lang="ts">
defineProps<{
  modelValue?: string | number | null;
  label: string;
  options: Array<{ label: string; value: string | number }>;
}>();

defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <label class="form-field">
    <span>{{ label }}</span>
    <select class="form-input" :value="modelValue ?? ''" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option value="">Pilih</option>
      <option v-for="item in options" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
  </label>
</template>

