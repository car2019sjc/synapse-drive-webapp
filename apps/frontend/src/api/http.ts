/**
 * Cliente axios global. Adiciona automaticamente o JWT do auth store
 * e trata 401 (sessão expirada) redirecionando para o login.
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  withCredentials: false,
});

let tokenGetter: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function configureHttp(opts: {
  getToken: () => string | null;
  onUnauthorized?: () => void;
}) {
  tokenGetter = opts.getToken;
  if (opts.onUnauthorized) onUnauthorized = opts.onUnauthorized;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenGetter();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export interface ApiErrorBody {
  error?: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
}

/** Extrai uma mensagem amigável de qualquer erro do axios. */
export function extractErrorMessage(error: unknown, fallback = 'Erro inesperado'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.message) return body.message;
    if (error.code === 'ECONNABORTED') return 'A requisição demorou muito (timeout).';
    if (error.code === 'ERR_NETWORK') return 'Falha de rede ao falar com o servidor.';
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
