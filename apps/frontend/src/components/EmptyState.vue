<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
    <svg
      class="h-10 w-10 text-slate-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25l2.25 2.25H18A2.25 2.25 0 0 1 20.25 8.25v9.75A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6Z"
      />
    </svg>
    <p class="mt-3 text-sm font-medium text-slate-700">{{ title }}</p>
    <p v-if="description" class="mt-1 text-xs text-slate-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
