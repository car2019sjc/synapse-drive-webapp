import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationKind = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  kind: NotificationKind;
  title: string;
  message?: string;
  timeout: number;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([]);
  let nextId = 1;

  function push(kind: NotificationKind, title: string, message?: string, timeout = 4500) {
    const n: Notification = { id: nextId++, kind, title, message, timeout };
    items.value.push(n);
    if (timeout > 0) {
      window.setTimeout(() => dismiss(n.id), timeout);
    }
    return n.id;
  }

  function dismiss(id: number) {
    items.value = items.value.filter((n) => n.id !== id);
  }

  return {
    items,
    push,
    dismiss,
    success: (title: string, message?: string) => push('success', title, message),
    error: (title: string, message?: string) => push('error', title, message, 7000),
    info: (title: string, message?: string) => push('info', title, message),
    warning: (title: string, message?: string) => push('warning', title, message, 6000),
  };
});
