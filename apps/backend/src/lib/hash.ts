import { createHash } from 'node:crypto';

/** Calcula SHA256 hex de um buffer/string. */
export const sha256 = (data: Buffer | string): string =>
  createHash('sha256').update(data).digest('hex');
