import type {
  Firmware,
  FirmwareCreateMeta,
  FirmwareUpdate,
  Paginated,
  PaginationQuery,
} from '@synapse/shared';
import { http } from './http';

export const firmwaresApi = {
  async list(query: Partial<PaginationQuery> = {}): Promise<Paginated<Firmware>> {
    const { data } = await http.get<Paginated<Firmware>>('/api/firmwares', { params: query });
    return data;
  },

  async get(id: string): Promise<Firmware> {
    const { data } = await http.get<Firmware>(`/api/firmwares/${id}`);
    return data;
  },

  async create(meta: FirmwareCreateMeta, file: File, onProgress?: (pct: number) => void): Promise<Firmware> {
    const form = new FormData();
    form.append('meta', JSON.stringify(meta));
    form.append('file', file);

    const { data } = await http.post<Firmware>('/api/firmwares', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onProgress || !evt.total) return;
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });
    return data;
  },

  async update(id: string, payload: FirmwareUpdate): Promise<Firmware> {
    const { data } = await http.patch<Firmware>(`/api/firmwares/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/api/firmwares/${id}`);
  },
};
