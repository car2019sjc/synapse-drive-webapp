<script setup lang="ts">
import { computed } from 'vue';

type Tone = 'green' | 'red' | 'amber' | 'slate' | 'brand';

const props = withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'slate' });

const cls = computed(() => `badge badge-${props.tone}`);
</script>

<template>
  <span :class="cls"><slot /></span>
</template>
