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
      <div class="mb-8 flex flex-col items-center text-center">
        <img src="/favicon.svg" alt="" class="h-12 w-12" />
        <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          Synapse Drive
        </h1>
        <p class="mt-1 text-sm text-slate-500">Painel administrativo</p>
      </div>

      <form
        novalidate
        class="card flex flex-col gap-4 p-6"
        @submit.prevent="onSubmit"
      >
        <h2 class="text-base font-semibold text-slate-900">Entrar</h2>

        <AppInput
          v-model="form.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          placeholder="voce@empresa.com"
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
          class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200"
        >
          {{ errors.form }}
        </div>

        <AppButton type="submit" full :loading="submitting">
          Entrar
        </AppButton>

        <RouterLink
          to="/"
          class="text-center text-xs text-slate-500 hover:text-slate-700"
        >
          ← Voltar para o site público
        </RouterLink>
      </form>
    </div>
  </div>
</template>
