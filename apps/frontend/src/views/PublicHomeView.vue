<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Firmware } from '@synapse/shared';
import { publicApi } from '@/api/public';
import { extractErrorMessage } from '@/api/http';
import { formatBytes, formatDate, shortHash } from '@/lib/format';
import AppBadge from '@/components/AppBadge.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import EmptyState from '@/components/EmptyState.vue';

const firmwares = ref<Firmware[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// URL do pacote estático servido pelo Netlify (public/downloads/).
// Atualizar via: pwsh -File scripts/build-installer-zip.ps1
const INSTALLER_URL = '/downloads/synapse-installer-windows.zip';
const INSTALLER_FILENAME = 'synapse-installer-windows.zip';

onMounted(async () => {
  try {
    firmwares.value = await publicApi.listActiveFirmwares();
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível carregar a lista de firmwares.');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <!-- Hero -->
  <section class="bg-gradient-to-br from-brand-50 via-white to-white">
    <div class="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span class="badge badge-brand">Ferramenta oficial</span>
          <h1 class="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Instalador de driver USBasp + atualizador de firmware
          </h1>
          <p class="mt-4 text-base text-slate-600">
            Configure o driver USBasp no Windows com poucos cliques e atualize o firmware do
            seu equipamento usando os arquivos oficiais publicados aqui.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              :href="INSTALLER_URL"
              :download="INSTALLER_FILENAME"
              class="btn btn-primary"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              Baixar instalador (Windows)
            </a>
            <a
              href="#firmwares"
              class="btn btn-secondary"
            >
              Ver firmwares disponíveis
            </a>
          </div>
          <p class="mt-3 text-xs text-slate-500">
            Compatível com Windows 10 e 11 (x64). Requer permissão de administrador. ZIP de ~12 MB com drivers + utilitários.
          </p>
        </div>

        <!-- Card ilustrativo -->
        <div class="card relative overflow-hidden p-6">
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-brand-700" />
          <h3 class="text-sm font-semibold text-slate-900">Como funciona</h3>
          <ol class="mt-4 space-y-3 text-sm text-slate-600">
            <li class="flex gap-3">
              <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">1</span>
              <span>Baixe e execute o instalador como administrador.</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">2</span>
              <span>O app instala o driver USBasp e detecta o gravador conectado.</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">3</span>
              <span>Selecione o firmware desejado e o instalador faz a gravação automaticamente.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>

  <!-- Lista de firmwares -->
  <section id="firmwares" class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-6xl px-6 py-14">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">Firmwares disponíveis</h2>
          <p class="mt-1 text-sm text-slate-500">
            Versões oficiais publicadas pela equipe administrativa.
          </p>
        </div>
      </div>

      <div class="mt-6">
        <div v-if="loading" class="flex justify-center py-10">
          <LoadingSpinner size="md" label="Carregando firmwares..." />
        </div>

        <div
          v-else-if="error"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </div>

        <EmptyState
          v-else-if="firmwares.length === 0"
          title="Nenhum firmware publicado ainda"
          description="Volte mais tarde — novas versões serão listadas aqui assim que forem publicadas."
        />

        <ul v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="fw in firmwares"
            :key="fw.id"
            class="card flex flex-col p-5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-slate-900">{{ fw.name }}</h3>
                <p class="mt-0.5 text-xs text-slate-500">v{{ fw.version }}</p>
              </div>
              <AppBadge tone="green">ativo</AppBadge>
            </div>

            <p
              v-if="fw.description"
              class="mt-3 line-clamp-3 text-xs text-slate-600"
            >
              {{ fw.description }}
            </p>

            <dl class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <dt>Tamanho</dt>
                <dd class="font-medium text-slate-700">{{ formatBytes(fw.fileSize) }}</dd>
              </div>
              <div>
                <dt>Publicado</dt>
                <dd class="font-medium text-slate-700">{{ formatDate(fw.createdAt) }}</dd>
              </div>
              <div class="col-span-2">
                <dt>SHA-256</dt>
                <dd class="font-mono text-[11px] text-slate-600" :title="fw.fileSha256">
                  {{ shortHash(fw.fileSha256, 16) }}
                </dd>
              </div>
            </dl>

            <div class="mt-5">
              <a
                :href="publicApi.firmwareDownloadUrl(fw.id)"
                :download="fw.fileName"
                class="btn btn-secondary w-full"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                </svg>
                Baixar {{ fw.fileName }}
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
