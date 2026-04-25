<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppLoadingOverlay from '../components/ui/AppLoadingOverlay.vue';
import AppToastHost from '../components/ui/AppToastHost.vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import MainLayout from '../layouts/MainLayout.vue';
import { useAppStore } from '../stores/app';

const route = useRoute();
const appStore = useAppStore();
const showRouteLoading = ref(false);
let routeLoadingTimer: number | null = null;

const layout = computed(() => (route.meta.layout === 'auth' ? AuthLayout : MainLayout));

onMounted(() => {
  appStore.bindNetworkState();
});

watch(
  () => appStore.routeLoading,
  (value) => {
    if (routeLoadingTimer) {
      window.clearTimeout(routeLoadingTimer);
      routeLoadingTimer = null;
    }

    if (value) {
      routeLoadingTimer = window.setTimeout(() => {
        showRouteLoading.value = true;
      }, 140);
      return;
    }

    showRouteLoading.value = false;
  },
);

onBeforeUnmount(() => {
  if (routeLoadingTimer) {
    window.clearTimeout(routeLoadingTimer);
  }
});
</script>

<template>
  <component :is="layout" />
  <Transition name="loading-fade">
    <div v-if="appStore.apiLoadingCount > 0" class="loading-topbar" aria-hidden="true">
      <span class="loading-topbar-track"></span>
    </div>
  </Transition>
  <AppLoadingOverlay :show="showRouteLoading" text="Membuka halaman..." />
  <AppToastHost />
</template>
