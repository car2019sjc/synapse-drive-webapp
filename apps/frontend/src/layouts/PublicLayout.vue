<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';

const supportEmail = 'joy.slotcar@gmail.com';
const supportPhoneDisplay = '+55 12 98134-1142';
const supportPhoneTel = '+5512981341142';
const supportPhoneWhatsApp = `https://wa.me/${supportPhoneTel.replace('+', '')}`;
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
                <svg class="mt-0.5 h-4 w-4 flex-none text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 0 1 2-2h2.28a1 1 0 0 1 .95.68l1.5 4.5a1 1 0 0 1-.5 1.21l-2.26 1.13a11 11 0 0 0 5.52 5.52l1.13-2.26a1 1 0 0 1 1.21-.5l4.5 1.5a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                </svg>
                <a
                  :href="`tel:${supportPhoneTel}`"
                  class="text-emerald-300 hover:text-white"
                >
                  {{ supportPhoneDisplay }}
                </a>
              </li>
              <li class="flex items-start gap-2">
                <svg class="mt-0.5 h-4 w-4 flex-none text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.337 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <a
                  :href="supportPhoneWhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-emerald-300 hover:text-white"
                >
                  WhatsApp
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
