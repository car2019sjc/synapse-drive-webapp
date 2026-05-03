<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    type?: string;
    placeholder?: string;
    autocomplete?: string;
    error?: string | null;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    maxlength?: number;
  }>(),
  { type: 'text', disabled: false, required: false }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();
const id = useId();

const inputClass = computed(() => ['input', props.error ? 'input-error' : '']);

function onInput(ev: Event) {
  const target = ev.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="label mb-1.5">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :class="inputClass"
      @input="onInput"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
