<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
    <p class="text-sm font-medium uppercase tracking-wide text-brand-600">404</p>
    <h1 class="text-3xl font-semibold text-slate-900">Página não encontrada</h1>
    <p class="max-w-sm text-sm text-slate-500">
      Verifique a URL ou volte para o início — talvez o link tenha sido alterado.
    </p>
    <RouterLink to="/" class="btn btn-primary mt-2">
      Voltar para o início
    </RouterLink>
  </div>
</template>
