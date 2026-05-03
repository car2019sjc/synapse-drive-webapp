/**
 * Store de autenticação. Persiste o JWT em localStorage e configura o
 * cliente axios para enviá-lo automaticamente. Ao receber 401, limpa o
 * estado e redireciona para /login.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AdminUser, LoginRequest } from '@synapse/shared';
import { authApi } from '@/api/auth';
import { configureHttp } from '@/api/http';
import router from '@/router';

const TOKEN_KEY = 'synapse:auth:token';
const USER_KEY = 'synapse:auth:user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<AdminUser | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  function bootstrap() {
    token.value = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (rawUser) {
      try {
        user.value = JSON.parse(rawUser) as AdminUser;
      } catch {
        user.value = null;
      }
    }
    configureHttp({
      getToken: () => token.value,
      onUnauthorized: () => {
        if (token.value) {
          clear();
          router.push({ name: 'login', query: { expired: '1' } });
        }
      },
    });
  }

  async function login(payload: LoginRequest): Promise<void> {
    loading.value = true;
    try {
      const res = await authApi.login(payload);
      token.value = res.token;
      user.value = res.user;
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } finally {
      loading.value = false;
    }
  }

  async function refreshMe(): Promise<void> {
    if (!token.value) return;
    try {
      const me = await authApi.me();
      user.value = me;
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch {
      // se /me falhar com 401, o interceptor já desloga
    }
  }

  function logout() {
    clear();
    router.push({ name: 'login' });
  }

  function clear() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    bootstrap,
    login,
    refreshMe,
    logout,
  };
});
