<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import homeAngleIcon from '@iconify-icons/solar/home-angle-bold-duotone';
import heartPulseIcon from '@iconify-icons/solar/heart-pulse-bold-duotone';
import qrCodeIcon from '@iconify-icons/solar/qr-code-bold-duotone';
import clipboardTextIcon from '@iconify-icons/solar/clipboard-text-bold-duotone';
import chartSquareIcon from '@iconify-icons/solar/chart-square-bold-duotone';
import notebookIcon from '@iconify-icons/solar/notebook-bold-duotone';
import usersGroupIcon from '@iconify-icons/solar/users-group-rounded-bold-duotone';
import settingsIcon from '@iconify-icons/solar/settings-bold-duotone';
import hamburgerIcon from '@iconify-icons/solar/hamburger-menu-line-duotone';
import userIcon from '@iconify-icons/solar/user-bold-duotone';
import logoutIcon from '@iconify-icons/solar/logout-2-bold-duotone';
import closeCircleIcon from '@iconify-icons/solar/close-circle-line-duotone';
import { useRoute, useRouter } from 'vue-router';
import { APP_NAME, APP_TAGLINE } from '../app/branding';
import { useAuthStore } from '../stores/auth';
import { useAppStore } from '../stores/app';
import { BOTTOM_NAV_CHANGED_EVENT, getHiddenBottomNavKeys } from '../utils/nav-access';

const authStore = useAuthStore();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const isMobileMenuOpen = ref(false);
const navVisibilityVersion = ref(0);
const pageTransitionName = ref('page-fade');
const lastHistoryPosition = ref(Number(window.history.state?.position ?? 0));

const roleCode = computed(() => authStore.user?.roles?.[0]?.code || null);

const navItems = computed(() => {
  navVisibilityVersion.value;
  const hiddenKeys = new Set(getHiddenBottomNavKeys(roleCode.value));
  return [
    { key: 'dashboard', label: 'Dashboard', icon: homeAngleIcon, to: '/', permission: 'dashboard.view', bottomNav: true },
    { key: 'toddlers', label: 'Balita', icon: heartPulseIcon, to: '/balita', permission: 'toddlers.view', bottomNav: true },
    { key: 'monthly-checkups', label: 'Pemeriksaan', icon: clipboardTextIcon, to: '/pemeriksaan-bulanan', permission: 'checkups.view', bottomNav: true },
    { key: 'scan-qr', label: 'Scan QR', icon: qrCodeIcon, to: '/scan-qr', permission: 'qrcode.scan', bottomNav: false },
    { key: 'reports', label: 'Laporan', icon: chartSquareIcon, to: '/laporan', permission: 'reports.view', bottomNav: true },
    { key: 'kia-reference', label: 'Acuan KIA', icon: notebookIcon, to: '/acuan-kia', permission: 'dashboard.view', bottomNav: false },
    { key: 'users', label: 'Users', icon: usersGroupIcon, to: '/users', permission: 'users.manage', bottomNav: false },
    { key: 'settings', label: 'Pengaturan', icon: settingsIcon, to: '/pengaturan', permission: 'settings.manage', bottomNav: false },
    { key: 'families-master', label: 'Master KK', icon: usersGroupIcon, to: '/master-keluarga', permission: 'toddlers.create', bottomNav: false },
  ]
    .filter((item) => !item.permission || authStore.hasPermission(item.permission))
    .map((item) => ({
      ...item,
      hiddenOnBottomNav: hiddenKeys.has(item.key),
    }));
});

const bottomNavItems = computed(() => navItems.value.filter((item) => item.bottomNav && !item.hiddenOnBottomNav));

const pageTitle = computed(() => {
  const match = navItems.value.find((item) => route.path.startsWith(item.to) && item.to !== '/');
  if (route.path === '/') return 'Dashboard';
  return match?.label || APP_NAME;
});

const handleLogout = async () => {
  isMobileMenuOpen.value = false;
  await authStore.logout();
  router.push('/login');
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const resolveTransitionName = (isBack: boolean) => {
  const isMobile = window.matchMedia('(max-width: 959px)').matches;
  if (!isMobile) return 'page-fade';
  return isBack ? 'page-slide-back' : 'page-slide-forward';
};

watch(
  () => route.fullPath,
  async () => {
    isMobileMenuOpen.value = false;
    await nextTick();
    const currentPosition = Number(window.history.state?.position ?? lastHistoryPosition.value);
    const isBack = currentPosition < lastHistoryPosition.value;
    pageTransitionName.value = resolveTransitionName(isBack);
    lastHistoryPosition.value = currentPosition;
  },
);

const onBottomNavSettingChanged = () => {
  navVisibilityVersion.value += 1;
};

onMounted(() => {
  pageTransitionName.value = resolveTransitionName(false);
  window.addEventListener(BOTTOM_NAV_CHANGED_EVENT, onBottomNavSettingChanged);
});

onBeforeUnmount(() => {
  window.removeEventListener(BOTTOM_NAV_CHANGED_EVENT, onBottomNavSettingChanged);
});
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">PA</div>
        <div>
          <h1>{{ APP_NAME }}</h1>
          <p>{{ APP_TAGLINE }}</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link" active-class="is-active">
          <Icon :icon="item.icon" width="22" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-mini">
          <strong>{{ authStore.user?.name }}</strong>
          <small>{{ authStore.user?.roles?.[0]?.name }}</small>
        </div>
        <button class="ghost-button" type="button" @click="handleLogout">Logout</button>
      </div>
    </aside>

    <div class="content-shell">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" type="button" aria-label="Buka menu" @click="isMobileMenuOpen = true">
            <Icon :icon="hamburgerIcon" width="22" />
          </button>
          <div class="topbar-title">
            <h2>{{ pageTitle }}</h2>
            <p>{{ appStore.online ? 'Online' : 'Offline mode' }}</p>
          </div>
        </div>
        <div class="topbar-right">
          <RouterLink to="/profil" class="profile-chip">
            <Icon :icon="userIcon" width="20" />
            <span>{{ authStore.user?.name }}</span>
          </RouterLink>
          <button class="topbar-logout" type="button" aria-label="Logout" @click="handleLogout">
            <Icon :icon="logoutIcon" width="20" />
          </button>
        </div>
      </header>

      <div v-if="!appStore.online" class="offline-banner">
        Jaringan sedang offline. Draft input pemeriksaan tetap bisa disimpan di perangkat.
      </div>

      <main class="page-shell">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <Transition :name="pageTransitionName" mode="out-in">
            <component :is="Component" :key="currentRoute.fullPath" class="page-view" />
          </Transition>
        </RouterView>
      </main>

      <nav v-if="bottomNavItems.length" class="bottom-nav">
        <RouterLink v-for="item in bottomNavItems" :key="item.to" :to="item.to" class="bottom-link" active-class="is-active">
          <span class="bottom-link-icon">
            <Icon :icon="item.icon" width="20" />
          </span>
          <span class="bottom-link-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="closeMobileMenu">
        <aside class="mobile-menu-panel" @click.stop>
          <div class="mobile-menu-head">
            <div class="brand">
              <div class="brand-mark">PA</div>
              <div>
                <h1>{{ APP_NAME }}</h1>
                <p>{{ authStore.user?.roles?.[0]?.name || '-' }}</p>
              </div>
            </div>
            <button class="menu-close" type="button" aria-label="Tutup menu" @click="closeMobileMenu">
              <Icon :icon="closeCircleIcon" width="24" />
            </button>
          </div>

          <nav class="mobile-menu-nav">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="nav-link"
              active-class="is-active"
              @click="closeMobileMenu"
            >
              <Icon :icon="item.icon" width="22" />
              <span>{{ item.label }}</span>
            </RouterLink>
            <RouterLink to="/profil" class="nav-link" active-class="is-active" @click="closeMobileMenu">
              <Icon :icon="userIcon" width="22" />
              <span>Profil</span>
            </RouterLink>
          </nav>

          <div class="mobile-menu-footer">
            <button class="app-button" type="button" data-block="true" @click="handleLogout">Logout</button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
