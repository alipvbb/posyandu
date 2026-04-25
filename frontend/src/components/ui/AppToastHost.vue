<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAppStore } from '../../stores/app';

const appStore = useAppStore();
const { toasts } = storeToRefs(appStore);
</script>

<template>
  <div class="toast-host">
    <div v-for="item in toasts" :key="item.id" class="toast-item" :data-type="item.type">
      {{ item.message }}
    </div>
  </div>
</template>

