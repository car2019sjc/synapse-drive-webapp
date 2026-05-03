<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  ALLOWED_FIRMWARE_EXTENSIONS,
  FirmwareCreateMetaSchema,
  MAX_FIRMWARE_SIZE,
} from '@synapse/shared';
import { firmwaresApi } from '@/api/firmwares';
import { extractErrorMessage } from '@/api/http';
import { useNotificationsStore } from '@/stores/notifications';
import AppButton from '@/components/AppButton.vue';
import AppInput from '@/components/AppInput.vue';
import AppModal from '@/components/AppModal.vue';
import AppTextarea from '@/components/AppTextarea.vue';
import { formatBytes } from '@/lib/format';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'created'): void }>();

const notify = useNotificationsStore();

const form = reactive({
  name: '',
  version: '',
  description: '',
  isActive: true,
});
const errors = reactive<{
  name?: string;
  version?: string;
  description?: string;
  file?: string;
  form?: string;
}>({});
const file = ref<File | null>(null);
const uploadPct = ref(0);
const submitting = ref(false);

const acceptAttr = ALLOWED_FIRMWARE_EXTENSIONS.join(',');

watch(
  () => props.open,
  (open) => {
    if (open) reset();
  }
);

function reset() {
  form.name = '';
  form.version = '';
  form.description = '';
  form.isActive = true;
  file.value = null;
  uploadPct.value = 0;
  errors.name = undefined;
  errors.version = undefined;
  errors.description = undefined;
  errors.file = undefined;
  errors.form = undefined;
}

function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const f = input.files?.[0];
  errors.file = undefined;
  if (!f) {
    file.value = null;
    return;
  }
  const ext = '.' + f.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FIRMWARE_EXTENSIONS.includes(ext as (typeof ALLOWED_FIRMWARE_EXTENSIONS)[number])) {
    errors.file = `Extensão "${ext}" não suportada. Use: ${ALLOWED_FIRMWARE_EXTENSIONS.join(', ')}`;
    file.value = null;
    return;
  }
  if (f.size > MAX_FIRMWARE_SIZE) {
    errors.file = `Arquivo excede ${formatBytes(MAX_FIRMWARE_SIZE)}.`;
    file.value = null;
    return;
  }
  file.value = f;
}

async function onSubmit() {
  errors.name = undefined;
  errors.version = undefined;
  errors.description = undefined;
  errors.form = undefined;

  const parsed = FirmwareCreateMetaSchema.safeParse({
    name: form.name.trim(),
    version: form.version.trim(),
    description: form.description.trim() || undefined,
    isActive: form.isActive,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    errors.name = flat.name?.[0];
    errors.version = flat.version?.[0];
    errors.description = flat.description?.[0];
    return;
  }
  if (!file.value) {
    errors.file = 'Selecione o arquivo de firmware.';
    return;
  }

  submitting.value = true;
  try {
    await firmwaresApi.create(parsed.data, file.value, (pct) => (uploadPct.value = pct));
    notify.success('Firmware enviado!', `${parsed.data.name} v${parsed.data.version} publicado.`);
    emit('created');
    emit('close');
  } catch (err) {
    errors.form = extractErrorMessage(err, 'Erro ao enviar firmware.');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :open="open"
    title="Novo firmware"
    size="md"
    :close-on-backdrop="!submitting"
    @close="emit('close')"
  >
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="form.name"
          label="Nome"
          placeholder="ex: Trozoba Master"
          required
          :error="errors.name"
        />
        <AppInput
          v-model="form.version"
          label="Versão"
          placeholder="ex: 1.4.2"
          hint="Formato semver (1.2.3 ou 1.2.3-beta.1)"
          required
          :error="errors.version"
        />
      </div>

      <AppTextarea
        v-model="form.description"
        label="Descrição (opcional)"
        placeholder="Notas de release, hardware compatível, etc."
        :rows="3"
        :maxlength="2000"
        :error="errors.description"
      />

      <div>
        <label class="label mb-1.5">
          Arquivo de firmware <span class="text-red-500">*</span>
        </label>
        <div
          class="flex items-center gap-3 rounded-md border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-4"
          :class="errors.file ? 'border-red-300 bg-red-50/40' : ''"
        >
          <svg class="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-3-3v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
          <div class="flex-1 text-sm">
            <p v-if="file" class="font-medium text-slate-700">{{ file.name }}</p>
            <p v-else class="text-slate-500">
              Selecione um arquivo {{ ALLOWED_FIRMWARE_EXTENSIONS.join(', ') }}
            </p>
            <p v-if="file" class="text-xs text-slate-500">{{ formatBytes(file.size) }}</p>
          </div>
          <label class="btn btn-secondary cursor-pointer">
            <input
              type="file"
              class="sr-only"
              :accept="acceptAttr"
              @change="onFileChange"
            />
            Escolher
          </label>
        </div>
        <p v-if="errors.file" class="mt-1 text-xs text-red-600">{{ errors.file }}</p>
        <p v-else class="mt-1 text-xs text-slate-500">
          Tamanho máximo: {{ formatBytes(MAX_FIRMWARE_SIZE) }}
        </p>
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input
          v-model="form.isActive"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        Publicar imediatamente (ativo)
      </label>

      <div
        v-if="submitting && uploadPct > 0"
        class="rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700"
      >
        <p>Enviando arquivo... {{ uploadPct }}%</p>
        <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
          <div
            class="h-full bg-brand-600 transition-all"
            :style="{ width: `${uploadPct}%` }"
          />
        </div>
      </div>

      <div
        v-if="errors.form"
        class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200"
      >
        {{ errors.form }}
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton
          type="button"
          variant="secondary"
          :disabled="submitting"
          @click="emit('close')"
        >
          Cancelar
        </AppButton>
        <AppButton type="submit" :loading="submitting">Enviar firmware</AppButton>
      </div>
    </form>
  </AppModal>
</template>
