<script setup lang="ts">
defineProps<{
  modelValue?: string | number | null;
  label: string;
  options: Array<{ label: string; value: string | number }>;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  emptyHint?: string;
}>();

defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <label class="form-field" :data-invalid="error ? 'true' : 'false'">
    <span>
      {{ label }}
      <b v-if="required" class="required-mark">*</b>
    </span>
    <select
      class="form-input"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : 'false'"
      :value="modelValue ?? ''"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder || 'Pilih' }}</option>
      <option v-for="item in options" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
    <small v-if="error" class="field-error">{{ error }}</small>
    <small v-else-if="disabled && emptyHint" class="field-hint">{{ emptyHint }}</small>
    <small v-else-if="!options.length && emptyHint" class="field-error">{{ emptyHint }}</small>
    <small v-else-if="hint" class="field-hint">{{ hint }}</small>
  </label>
</template>
