import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'public-home',
        component: () => import('@/views/PublicHomeView.vue'),
        meta: { title: 'Synapse Drive' },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Entrar - Synapse Drive', guestOnly: true },
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    redirect: { name: 'admin-firmwares' },
    children: [
      {
        path: 'firmwares',
        name: 'admin-firmwares',
        component: () => import('@/views/admin/FirmwaresView.vue'),
        meta: { title: 'Firmwares - Synapse Drive' },
      },
      {
        path: 'instalacoes',
        name: 'admin-installations',
        component: () => import('@/views/admin/InstallationsView.vue'),
        meta: { title: 'Instalações - Synapse Drive' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Página não encontrada' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'admin-firmwares' };
  }
  return true;
});

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? 'Synapse Drive';
  document.title = title;
});

export default router;
