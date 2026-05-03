<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'suporte@synapseia.com.br';
const appName = import.meta.env.VITE_APP_NAME || 'Synapse Drive';
const year = new Date().getFullYear();
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink to="/" class="flex items-center gap-2 text-brand-700 hover:text-brand-800">
          <img src="/favicon.svg" alt="" class="h-8 w-8" />
          <span class="text-lg font-semibold tracking-tight">{{ appName }}</span>
        </RouterLink>
        <nav class="flex items-center gap-2 text-sm">
          <RouterLink
            to="/login"
            class="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Acessar painel
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl px-6 py-6 text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
        <p>© {{ year }} {{ appName }}. Todos os direitos reservados.</p>
        <p class="mt-2 sm:mt-0">
          Suporte:
          <a class="text-brand-600 hover:underline" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a>
        </p>
      </div>
    </footer>
  </div>
</template>
