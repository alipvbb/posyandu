<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    closable?: boolean;
  }>(),
  {
    closable: true,
  },
);

defineEmits<{
  (event: 'close'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-overlay" @click.self="closable && $emit('close')">
      <div class="dialog-panel">
        <div class="dialog-head">
          <strong>{{ title }}</strong>
          <button v-if="closable" type="button" class="ghost-button" @click="$emit('close')">Tutup</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
