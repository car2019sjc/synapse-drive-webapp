import { z } from 'zod';

/** Versão semântica simples (1.2.3 ou 1.2.3-beta.1). */
const VersionSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, 'Use formato semver (ex: 1.2.3 ou 1.2.3-beta.1)');

export const FirmwareSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  version: z.string(),
  description: z.string().nullable(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  fileSha256: z.string().length(64),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Firmware = z.infer<typeof FirmwareSchema>;

export const FirmwareCreateMetaSchema = z.object({
  name: z.string().min(1).max(120),
  version: VersionSchema,
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});
export type FirmwareCreateMeta = z.infer<typeof FirmwareCreateMetaSchema>;

export const FirmwareUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  version: VersionSchema.optional(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});
export type FirmwareUpdate = z.infer<typeof FirmwareUpdateSchema>;

/** Extensões aceitas para upload de firmware. */
export const ALLOWED_FIRMWARE_EXTENSIONS = ['.hex', '.bin', '.elf', '.eep'] as const;

/** Tamanho máximo em bytes (10 MB - mais que suficiente pra .hex de AVR). */
export const MAX_FIRMWARE_SIZE = 10 * 1024 * 1024;
