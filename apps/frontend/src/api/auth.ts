import type { AdminUser, LoginRequest, LoginResponse } from '@synapse/shared';
import { http } from './http';

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/api/auth/login', payload);
    return data;
  },

  async me(): Promise<AdminUser> {
    const { data } = await http.get<AdminUser>('/api/auth/me');
    return data;
  },
};
