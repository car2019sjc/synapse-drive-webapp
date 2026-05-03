<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';

const store = useNotificationsStore();

const tones = {
  success: { ring: 'ring-emerald-200', bg: 'bg-emerald-50', icon: 'text-emerald-500' },
  error: { ring: 'ring-red-200', bg: 'bg-red-50', icon: 'text-red-500' },
  info: { ring: 'ring-brand-200', bg: 'bg-brand-50', icon: 'text-brand-500' },
  warning: { ring: 'ring-amber-200', bg: 'bg-amber-50', icon: 'text-amber-500' },
} as const;
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
    <TransitionGroup name="toast" tag="div" class="flex w-full max-w-sm flex-col gap-2">
      <div
        v-for="n in store.items"
        :key="n.id"
        :class="['pointer-events-auto rounded-lg ring-1 shadow-card', tones[n.kind].bg, tones[n.kind].ring]"
        class="flex items-start gap-3 px-4 py-3"
        role="status"
      >
        <span :class="tones[n.kind].icon" class="mt-0.5 flex-shrink-0">
          <svg v-if="n.kind === 'success'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="n.kind === 'error'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <svg v-else-if="n.kind === 'warning'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 4h.01" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
          </svg>
        </span>
        <div class="flex-1 text-sm">
          <p class="font-medium text-slate-900">{{ n.title }}</p>
          <p v-if="n.message" class="mt-0.5 text-slate-600">{{ n.message }}</p>
        </div>
        <button
          type="button"
          class="-mr-1 -mt-1 rounded-md p-1 text-slate-400 hover:bg-white/70 hover:text-slate-700"
          aria-label="Fechar notificação"
          @click="store.dismiss(n.id)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.18s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
