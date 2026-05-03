<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { FirmwareUpdateSchema, type Firmware } from '@synapse/shared';
import { firmwaresApi } from '@/api/firmwares';
import { extractErrorMessage } from '@/api/http';
import { useNotificationsStore } from '@/stores/notifications';
import AppButton from '@/components/AppButton.vue';
import AppInput from '@/components/AppInput.vue';
import AppModal from '@/components/AppModal.vue';
import AppTextarea from '@/components/AppTextarea.vue';

const props = defineProps<{ open: boolean; firmware: Firmware | null }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void }>();

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
  form?: string;
}>({});
const submitting = ref(false);

watch(
  () => [props.open, props.firmware] as const,
  ([open, fw]) => {
    if (open && fw) {
      form.name = fw.name;
      form.version = fw.version;
      form.description = fw.description ?? '';
      form.isActive = fw.isActive;
      errors.name = undefined;
      errors.version = undefined;
      errors.description = undefined;
      errors.form = undefined;
    }
  },
  { immediate: true }
);

async function onSubmit() {
  if (!props.firmware) return;
  errors.name = undefined;
  errors.version = undefined;
  errors.description = undefined;
  errors.form = undefined;

  const parsed = FirmwareUpdateSchema.safeParse({
    name: form.name.trim(),
    version: form.version.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    isActive: form.isActive,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    errors.name = flat.name?.[0];
    errors.version = flat.version?.[0];
    errors.description = flat.description?.[0];
    return;
  }

  submitting.value = true;
  try {
    await firmwaresApi.update(props.firmware.id, parsed.data);
    notify.success('Firmware atualizado.');
    emit('updated');
    emit('close');
  } catch (err) {
    errors.form = extractErrorMessage(err, 'Erro ao atualizar firmware.');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AppModal
    :open="open"
    title="Editar firmware"
    size="md"
    :close-on-backdrop="!submitting"
    @close="emit('close')"
  >
    <form
      v-if="firmware"
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="onSubmit"
    >
      <p class="text-xs text-slate-500">
        O arquivo binário é imutável. Para uma nova versão, faça upload de um novo firmware.
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="form.name"
          label="Nome"
          required
          :error="errors.name"
        />
        <AppInput
          v-model="form.version"
          label="Versão"
          hint="Formato semver"
          required
          :error="errors.version"
        />
      </div>

      <AppTextarea
        v-model="form.description"
        label="Descrição"
        :rows="3"
        :maxlength="2000"
        :error="errors.description"
      />

      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input
          v-model="form.isActive"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        Publicado (visível na página pública)
      </label>

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
        <AppButton type="submit" :loading="submitting">Salvar alterações</AppButton>
      </div>
    </form>
  </AppModal>
</template>
