<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const sidebarOpen = ref(false);

onMounted(() => {
  void auth.refreshMe();
});

const nav = [
  {
    to: { name: 'admin-firmwares' },
    label: 'Firmwares',
    icon: 'M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7m18 0a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2m18 0l-9 6-9-6',
  },
  {
    to: { name: 'admin-installations' },
    label: 'Instalações',
    icon: 'M9 17v-6h13M9 11l3.5-3.5M9 11l3.5 3.5M3 6h13M3 18h13',
  },
];

function logout() {
  auth.logout();
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Top bar mobile -->
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <button
        type="button"
        class="rounded-md p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Abrir menu"
        @click="sidebarOpen = !sidebarOpen"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span class="text-sm font-semibold text-slate-700">Synapse Drive</span>
      <span class="w-9" aria-hidden="true" />
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-slate-200 transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ]"
      >
        <div class="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
          <img src="/favicon.svg" alt="" class="h-7 w-7" />
          <span class="text-base font-semibold text-slate-800">Synapse Drive</span>
        </div>

        <nav class="flex flex-col gap-1 p-3">
          <RouterLink
            v-for="item in nav"
            :key="item.label"
            :to="item.to"
            class="group flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            active-class="bg-brand-50 !text-brand-700 font-medium"
            @click="sidebarOpen = false"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
          <div class="mb-2 px-2 text-xs">
            <p class="truncate font-medium text-slate-700">{{ auth.user?.name ?? 'Admin' }}</p>
            <p class="truncate text-slate-500">{{ auth.user?.email ?? '' }}</p>
          </div>
          <button
            type="button"
            class="btn btn-ghost w-full justify-start"
            @click="logout"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      <!-- Backdrop mobile -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
        @click="sidebarOpen = false"
      />

      <!-- Content -->
      <main class="flex-1 min-w-0">
        <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <RouterView :key="route.fullPath" />
        </div>
      </main>
    </div>
  </div>
</template>
