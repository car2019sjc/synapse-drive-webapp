import type { Installation, Paginated, PaginationQuery } from '@synapse/shared';
import { http } from './http';

export interface InstallationStats {
  total: number;
  success: number;
  failed: number;
  lastWeek: number;
}

export const installationsApi = {
  async list(query: Partial<PaginationQuery> = {}): Promise<Paginated<Installation>> {
    const { data } = await http.get<Paginated<Installation>>('/api/installations', {
      params: query,
    });
    return data;
  },

  async stats(): Promise<InstallationStats> {
    const { data } = await http.get<InstallationStats>('/api/installations/stats');
    return data;
  },
};
