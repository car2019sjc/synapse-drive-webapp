<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    error?: string | null;
    hint?: string;
    disabled?: boolean;
    rows?: number;
    maxlength?: number;
  }>(),
  { disabled: false, rows: 3 }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();
const id = useId();

const inputClass = computed(() => ['input', props.error ? 'input-error' : '', 'resize-y']);

function onInput(ev: Event) {
  const target = ev.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="label mb-1.5">{{ label }}</label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxlength"
      :class="inputClass"
      @input="onInput"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
