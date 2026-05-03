<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    closeOnBackdrop?: boolean;
  }>(),
  { size: 'md', closeOnBackdrop: true }
);

const emit = defineEmits<{ (e: 'close'): void }>();

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

function onBackdrop() {
  if (props.closeOnBackdrop) emit('close');
}

function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape' && props.open) emit('close');
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onKey);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          @click="onBackdrop"
        />
        <div
          :class="['relative w-full', sizeClass[size]]"
          class="card animate-fade-in p-6"
          @click.stop
        >
          <header v-if="title || $slots.header" class="mb-4 flex items-start justify-between gap-4">
            <div class="min-w-0">
              <slot name="header">
                <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
              </slot>
            </div>
            <button
              type="button"
              class="-mr-2 -mt-2 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fechar"
              @click="emit('close')"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          <div>
            <slot />
          </div>
          <footer v-if="$slots.footer" class="mt-6 flex justify-end gap-2">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
