<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg'; label?: string }>(), {
  size: 'md',
});
const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
</script>

<template>
  <div class="inline-flex items-center gap-2 text-slate-500">
    <svg :class="sizeMap[size]" class="animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
    </svg>
    <span v-if="label" class="text-sm">{{ label }}</span>
  </div>
</template>
