<script setup lang="ts">
defineProps<{
  modelValue?: string | number | null;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  min?: string | number;
  max?: string | number;
  step?: string | number;
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
    <input
      class="form-input"
      :type="type || 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :inputmode="inputmode"
      :min="min"
      :max="max"
      :step="step"
      :aria-invalid="error ? 'true' : 'false'"
      :value="modelValue ?? ''"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <small v-if="error" class="field-error">{{ error }}</small>
    <small v-else-if="hint" class="field-hint">{{ hint }}</small>
  </label>
</template>
