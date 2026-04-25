import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAppStore } from '../stores/app';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true, guestOnly: true, layout: 'auth' },
  },
  {
    path: '/public/cards/:token',
    name: 'public-card',
    component: () => import('../views/PublicCardView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { permission: 'dashboard.view' },
  },
  {
    path: '/balita',
    name: 'toddlers',
    component: () => import('../views/ToddlersView.vue'),
    meta: { permission: 'toddlers.view' },
  },
  {
    path: '/balita/tambah',
    name: 'toddler-create',
    component: () => import('../views/ToddlerFormView.vue'),
    meta: { permission: 'toddlers.create' },
  },
  {
    path: '/balita/:id',
    name: 'toddler-detail',
    component: () => import('../views/ToddlerDetailView.vue'),
    meta: { permission: 'toddlers.view' },
  },
  {
    path: '/balita/:id/edit',
    name: 'toddler-edit',
    component: () => import('../views/ToddlerFormView.vue'),
    meta: { permission: 'toddlers.update' },
  },
  {
    path: '/balita/:id/pemeriksaan',
    name: 'checkup-create',
    component: () => import('../views/CheckupFormView.vue'),
    meta: { permission: 'checkups.create' },
  },
  {
    path: '/pemeriksaan-bulanan',
    name: 'monthly-checkups',
    component: () => import('../views/DailyCheckupView.vue'),
    meta: { permission: 'checkups.view' },
  },
  {
    path: '/pemeriksaan-harian',
    redirect: '/pemeriksaan-bulanan',
  },
  {
    path: '/balita/:id/pemeriksaan/:checkupId/edit',
    name: 'checkup-edit',
    component: () => import('../views/CheckupFormView.vue'),
    meta: { permission: 'checkups.update' },
  },
  {
    path: '/scan-qr',
    name: 'scan-qr',
    component: () => import('../views/ScanQrView.vue'),
    meta: { permission: 'qrcode.scan' },
  },
  {
    path: '/kartu/:id',
    name: 'card',
    component: () => import('../views/CardView.vue'),
    meta: { permission: 'cards.generate' },
  },
  {
    path: '/laporan',
    name: 'reports',
    component: () => import('../views/ReportsView.vue'),
    meta: { permission: 'reports.view' },
  },
  {
    path: '/acuan-kia',
    name: 'kia-reference',
    component: () => import('../views/KiaReferenceView.vue'),
    meta: { permission: 'dashboard.view' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UsersView.vue'),
    meta: { permission: 'users.manage' },
  },
  {
    path: '/master-keluarga',
    name: 'families-master',
    component: () => import('../views/FamiliesView.vue'),
    meta: { permission: 'toddlers.create' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('../views/RolesView.vue'),
    meta: { permission: 'roles.manage' },
  },
  {
    path: '/profil',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
  },
  {
    path: '/pengaturan',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { permission: 'settings.manage' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { public: true, layout: 'auth' },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const appStore = useAppStore();
  appStore.setRouteLoading(true);

  if (!to.meta.public && !authStore.user) {
    await authStore.loadProfile();
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  const permission = to.meta.permission as string | undefined;
  if (permission && !authStore.hasPermission(permission)) {
    return { name: 'dashboard' };
  }

  return true;
});

router.afterEach(() => {
  const appStore = useAppStore();
  appStore.setRouteLoading(false);
});

router.onError(() => {
  const appStore = useAppStore();
  appStore.setRouteLoading(false);
});
