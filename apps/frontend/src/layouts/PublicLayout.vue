<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';

const supportEmail = 'joy.slotcar@gmail.com';
const appName = import.meta.env.VITE_APP_NAME || 'Synapse Drive';
const year = new Date().getFullYear();
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Top bar -->
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink to="/" class="flex items-center gap-2.5 text-brand-700 hover:text-brand-800">
          <img src="/favicon.svg" alt="" class="h-9 w-9" />
          <div class="leading-tight">
            <p class="text-base font-semibold tracking-tight">{{ appName }}</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-400">Joy Slot Car</p>
          </div>
        </RouterLink>

        <nav class="flex items-center gap-1 text-sm">
          <a
            href="#hardware"
            class="hidden rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
          >
            Hardware
          </a>
          <a
            href="#instalacao"
            class="hidden rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline-block"
          >
            Como instalar
          </a>
          <a
            href="#firmwares"
            class="hidden rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline-block"
          >
            Firmwares
          </a>
          <a
            href="#duvidas"
            class="hidden rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:inline-block"
          >
            Dúvidas
          </a>
          <RouterLink
            to="/login"
            class="ml-2 rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
          >
            Painel admin
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div class="mx-auto max-w-6xl px-6 py-10">
        <div class="grid gap-8 sm:grid-cols-3">
          <div>
            <div class="flex items-center gap-2">
              <img src="/favicon.svg" alt="" class="h-7 w-7" />
              <span class="text-base font-semibold text-white">{{ appName }}</span>
            </div>
            <p class="mt-3 text-xs text-slate-400">
              Ferramenta oficial para configurar o gravador USBasp e atualizar o firmware
              do seu equipamento Joy Slot Car com poucos cliques.
            </p>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Atalhos
            </h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li>
                <a href="#hardware" class="hover:text-white">Acessórios necessários</a>
              </li>
              <li>
                <a href="#instalacao" class="hover:text-white">Como instalar</a>
              </li>
              <li>
                <a href="#firmwares" class="hover:text-white">Firmwares disponíveis</a>
              </li>
              <li>
                <a href="#duvidas" class="hover:text-white">Perguntas frequentes</a>
              </li>
              <li>
                <RouterLink to="/login" class="hover:text-white">Painel administrativo</RouterLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Contato &amp; suporte
            </h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li class="flex items-start gap-2">
                <svg class="mt-0.5 h-4 w-4 flex-none text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8l-9 6-9-6m18 0v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2" />
                </svg>
                <a
                  :href="`mailto:${supportEmail}`"
                  class="break-all text-brand-300 hover:text-white"
                >
                  {{ supportEmail }}
                </a>
              </li>
              <li class="flex items-start gap-2">
                <svg class="mt-0.5 h-4 w-4 flex-none text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0a9 9 0 0 1 18 0z" />
                </svg>
                <span class="text-slate-300">Resposta em até 1 dia útil</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
          <p>© {{ year }} {{ appName }} — Joy Slot Car. Todos os direitos reservados.</p>
          <p class="mt-2 sm:mt-0">
            Compatível com Windows 10 e 11 (x64).
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
