import type { Firmware } from '@synapse/shared';
import { http } from './http';

export const publicApi = {
  async listActiveFirmwares(): Promise<Firmware[]> {
    const { data } = await http.get<Firmware[]>('/api/public/firmwares');
    return data;
  },

  /** URL absoluta de download (usada como href em <a download>). */
  firmwareDownloadUrl(id: string): string {
    const base = http.defaults.baseURL ?? '';
    return `${base}/api/public/firmwares/${id}/file`;
  },
};
