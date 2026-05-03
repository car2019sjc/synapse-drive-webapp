<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Firmware } from '@synapse/shared';
import { firmwaresApi } from '@/api/firmwares';
import { extractErrorMessage } from '@/api/http';
import { useNotificationsStore } from '@/stores/notifications';
import AppBadge from '@/components/AppBadge.vue';
import AppButton from '@/components/AppButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { formatBytes, formatDate, shortHash } from '@/lib/format';
import FirmwareUploadModal from './FirmwareUploadModal.vue';
import FirmwareEditModal from './FirmwareEditModal.vue';

const notify = useNotificationsStore();

const items = ref<Firmware[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);
const loading = ref(false);
const error = ref<string | null>(null);

const showUpload = ref(false);
const editTarget = ref<Firmware | null>(null);
const deletingId = ref<string | null>(null);

const hasItems = computed(() => items.value.length > 0);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await firmwaresApi.list({ page: page.value, pageSize: pageSize.value });
    items.value = data.items;
    total.value = data.total;
    totalPages.value = data.totalPages || 1;
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível carregar firmwares.');
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function onCreated() {
  page.value = 1;
  await load();
}

async function onUpdated() {
  await load();
}

async function onToggleActive(fw: Firmware) {
  try {
    const updated = await firmwaresApi.update(fw.id, { isActive: !fw.isActive });
    const idx = items.value.findIndex((f) => f.id === fw.id);
    if (idx !== -1) items.value[idx] = updated;
    notify.success(updated.isActive ? 'Firmware publicado.' : 'Firmware ocultado.');
  } catch (err) {
    notify.error('Falhou', extractErrorMessage(err));
  }
}

async function onDelete(fw: Firmware) {
  const ok = window.confirm(
    `Excluir definitivamente "${fw.name}" v${fw.version}?\n\nEsta ação não pode ser desfeita.`
  );
  if (!ok) return;
  deletingId.value = fw.id;
  try {
    await firmwaresApi.remove(fw.id);
    items.value = items.value.filter((f) => f.id !== fw.id);
    total.value = Math.max(0, total.value - 1);
    notify.success('Firmware excluído.');
  } catch (err) {
    notify.error('Erro ao excluir', extractErrorMessage(err));
  } finally {
    deletingId.value = null;
  }
}

function changePage(delta: number) {
  const next = page.value + delta;
  if (next < 1 || next > totalPages.value) return;
  page.value = next;
  void load();
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Firmwares</h1>
        <p class="mt-1 text-sm text-slate-500">
          Publique novas versões e gerencie as existentes.
        </p>
      </div>
      <AppButton @click="showUpload = true">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo firmware
      </AppButton>
    </header>

    <section class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner label="Carregando firmwares..." />
      </div>

      <div
        v-else-if="error"
        class="px-4 py-3 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div v-else-if="!hasItems" class="p-6">
        <EmptyState
          title="Nenhum firmware cadastrado"
          description="Clique em 'Novo firmware' para enviar o primeiro arquivo."
        >
          <template #action>
            <AppButton @click="showUpload = true">Adicionar primeiro firmware</AppButton>
          </template>
        </EmptyState>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-4 py-3">Nome / Versão</th>
              <th class="px-4 py-3">Arquivo</th>
              <th class="px-4 py-3">SHA-256</th>
              <th class="px-4 py-3">Atualizado</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="fw in items" :key="fw.id" class="hover:bg-slate-50/60">
              <td class="px-4 py-3 align-top">
                <p class="font-medium text-slate-900">{{ fw.name }}</p>
                <p class="text-xs text-slate-500">v{{ fw.version }}</p>
                <p
                  v-if="fw.description"
                  class="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500"
                >
                  {{ fw.description }}
                </p>
              </td>
              <td class="px-4 py-3 align-top text-xs">
                <p class="font-medium text-slate-700">{{ fw.fileName }}</p>
                <p class="text-slate-500">{{ formatBytes(fw.fileSize) }}</p>
              </td>
              <td class="px-4 py-3 align-top">
                <code class="font-mono text-[11px] text-slate-600" :title="fw.fileSha256">
                  {{ shortHash(fw.fileSha256, 12) }}
                </code>
              </td>
              <td class="px-4 py-3 align-top text-xs text-slate-600">
                {{ formatDate(fw.updatedAt) }}
              </td>
              <td class="px-4 py-3 align-top">
                <button
                  type="button"
                  class="inline-flex"
                  :title="fw.isActive ? 'Desativar' : 'Ativar'"
                  @click="onToggleActive(fw)"
                >
                  <AppBadge :tone="fw.isActive ? 'green' : 'slate'">
                    {{ fw.isActive ? 'ativo' : 'inativo' }}
                  </AppBadge>
                </button>
              </td>
              <td class="px-4 py-3 align-top text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="btn btn-ghost px-2 py-1 text-xs"
                    @click="editTarget = fw"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    :disabled="deletingId === fw.id"
                    @click="onDelete(fw)"
                  >
                    {{ deletingId === fw.id ? 'Excluindo...' : 'Excluir' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        v-if="hasItems"
        class="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600"
      >
        <span>
          {{ total }} firmware<span v-if="total !== 1">s</span> · página {{ page }} de {{ totalPages }}
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

    <FirmwareUploadModal
      :open="showUpload"
      @close="showUpload = false"
      @created="onCreated"
    />

    <FirmwareEditModal
      :open="!!editTarget"
      :firmware="editTarget"
      @close="editTarget = null"
      @updated="onUpdated"
    />
  </div>
</template>
