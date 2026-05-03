<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Installation } from '@synapse/shared';
import { installationsApi, type InstallationStats } from '@/api/installations';
import { extractErrorMessage } from '@/api/http';
import AppBadge from '@/components/AppBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { formatDate } from '@/lib/format';

const items = ref<Installation[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);
const stats = ref<InstallationStats | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [list, statsData] = await Promise.all([
      installationsApi.list({ page: page.value, pageSize: pageSize.value }),
      installationsApi.stats().catch(() => null),
    ]);
    items.value = list.items;
    total.value = list.total;
    totalPages.value = list.totalPages || 1;
    if (statsData) stats.value = statsData;
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível carregar instalações.');
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function changePage(delta: number) {
  const next = page.value + delta;
  if (next < 1 || next > totalPages.value) return;
  page.value = next;
  void load();
}

const statusTone = (s: Installation['status']) =>
  s === 'success' ? 'green' : s === 'failed' ? 'red' : 'amber';

const successRate = computed(() => {
  if (!stats.value || stats.value.total === 0) return null;
  return Math.round((stats.value.success / stats.value.total) * 100);
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Instalações</h1>
      <p class="mt-1 text-sm text-slate-500">
        Telemetria enviada pelos clientes do instalador Synapse Drive.
      </p>
    </header>

    <!-- Stats -->
    <section
      v-if="stats"
      class="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <div class="card p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Total</p>
        <p class="mt-1 text-2xl font-semibold text-slate-900">{{ stats.total }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Sucesso</p>
        <p class="mt-1 text-2xl font-semibold text-emerald-600">{{ stats.success }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Falhas</p>
        <p class="mt-1 text-2xl font-semibold text-red-600">{{ stats.failed }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs uppercase tracking-wide text-slate-500">Últimos 7 dias</p>
        <p class="mt-1 text-2xl font-semibold text-brand-600">{{ stats.lastWeek }}</p>
        <p v-if="successRate !== null" class="text-xs text-slate-500">
          Taxa de sucesso geral: {{ successRate }}%
        </p>
      </div>
    </section>

    <section class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner label="Carregando..." />
      </div>

      <div v-else-if="error" class="px-4 py-3 text-sm text-red-700">{{ error }}</div>

      <div v-else-if="items.length === 0" class="p-6">
        <EmptyState
          title="Nenhuma instalação registrada ainda"
          description="Os relatórios aparecerão aqui assim que clientes começarem a usar o instalador."
        />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-4 py-3">Quando</th>
              <th class="px-4 py-3">Firmware</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">IP</th>
              <th class="px-4 py-3">Cliente</th>
              <th class="px-4 py-3">Erro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in items" :key="row.id">
              <td class="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                {{ formatDate(row.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <p v-if="row.firmwareName" class="font-medium text-slate-800">
                  {{ row.firmwareName }}
                </p>
                <p v-if="row.firmwareVersion" class="text-xs text-slate-500">
                  v{{ row.firmwareVersion }}
                </p>
                <p v-if="!row.firmwareName" class="text-xs italic text-slate-400">
                  (sem firmware)
                </p>
              </td>
              <td class="px-4 py-3">
                <AppBadge :tone="statusTone(row.status)">{{ row.status }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600">
                {{ row.ipAddress ?? '-' }}
              </td>
              <td class="px-4 py-3 text-xs text-slate-500" :title="row.userAgent ?? ''">
                <span class="line-clamp-1 max-w-[18rem]">
                  {{ row.userAgent ?? '-' }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-red-600">
                <span v-if="row.errorMessage" class="line-clamp-2 max-w-xs" :title="row.errorMessage">
                  {{ row.errorMessage }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        v-if="items.length > 0"
        class="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600"
      >
        <span>
          {{ total }} registro<span v-if="total !== 1">s</span> · página {{ page }} de {{ totalPages }}
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-secondary px-3 py-1 text-xs"
            :disabled="page <= 1 || loading"
            @click="changePage(-1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="btn btn-secondary px-3 py-1 text-xs"
            :disabled="page >= totalPages || loading"
            @click="changePage(1)"
          >
            Próxima
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>
