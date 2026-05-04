<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LoginRequestSchema } from '@synapse/shared';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { extractErrorMessage } from '@/api/http';
import AppButton from '@/components/AppButton.vue';
import AppInput from '@/components/AppInput.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const notify = useNotificationsStore();

const form = reactive({ email: '', password: '' });
const errors = reactive<{ email?: string; password?: string; form?: string }>({});
const submitting = ref(false);

const SUPPORT_EMAIL = 'joy.slotcar@gmail.com';

onMounted(() => {
  if (route.query.expired === '1') {
    notify.warning('Sessão expirada', 'Faça login novamente para continuar.');
  }
});

async function onSubmit() {
  errors.email = undefined;
  errors.password = undefined;
  errors.form = undefined;

  const parsed = LoginRequestSchema.safeParse(form);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    errors.email = flat.email?.[0];
    errors.password = flat.password?.[0];
    return;
  }

  submitting.value = true;
  try {
    await auth.login(parsed.data);
    notify.success('Bem-vindo!', `Olá, ${auth.user?.name ?? 'admin'}.`);
    const redirect = (route.query.redirect as string | undefined) ?? '/admin';
    await router.push(redirect);
  } catch (err) {
    errors.form = extractErrorMessage(err, 'Não foi possível entrar.');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-slate-50 to-white">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <RouterLink
        to="/"
        class="mb-8 inline-flex items-center gap-1 self-start text-xs text-slate-500 hover:text-slate-700"
      >
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para o site
      </RouterLink>

      <div class="mb-6 flex flex-col items-center text-center">
        <img src="/favicon.svg" alt="" class="h-14 w-14 drop-shadow-sm" />
        <h1 class="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Synapse Drive
        </h1>
        <p class="mt-1 text-sm text-slate-500">Painel administrativo — Joy Slot Car</p>
      </div>

      <form
        novalidate
        class="card flex flex-col gap-4 p-6 shadow-card"
        @submit.prevent="onSubmit"
      >
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 11c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm6 0c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zM3 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M21 21v-2a4 4 0 0 0-3-3.87" />
          </svg>
          <h2 class="text-base font-semibold text-slate-900">Entrar</h2>
        </div>

        <p class="text-xs text-slate-500">
          Acesso restrito à equipe administrativa para gerenciar firmwares
          e ver relatórios de instalação.
        </p>

        <AppInput
          v-model="form.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          placeholder="voce@exemplo.com"
          required
          :error="errors.email"
        />

        <AppInput
          v-model="form.password"
          label="Senha"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
          :error="errors.password"
        />

        <div
          v-if="errors.form"
          class="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200"
        >
          <svg class="mt-0.5 h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <span>{{ errors.form }}</span>
        </div>

        <AppButton type="submit" full :loading="submitting">
          {{ submitting ? 'Entrando...' : 'Entrar no painel' }}
        </AppButton>
      </form>

      <div class="mt-6 rounded-lg border border-slate-200 bg-white/60 p-4 text-xs text-slate-600 backdrop-blur">
        <p class="font-semibold text-slate-700">É um cliente final?</p>
        <p class="mt-1">
          Você não precisa fazer login.
          <RouterLink to="/" class="font-medium text-brand-600 hover:underline">
            Volte para a página principal
          </RouterLink>
          e baixe o instalador diretamente.
        </p>
      </div>

      <p class="mt-6 text-center text-xs text-slate-400">
        Esqueceu a senha? Fale com
        <a :href="`mailto:${SUPPORT_EMAIL}`" class="text-brand-600 hover:underline">
          {{ SUPPORT_EMAIL }}
        </a>
      </p>
    </div>
  </div>
</template>
