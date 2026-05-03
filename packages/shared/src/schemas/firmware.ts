import { z } from 'zod';

/**
 * Versão semântica flexível.
 * Aceita:
 *   - MAJOR.MINOR.PATCH                (ex: 1.2.3)
 *   - MAJOR.MINOR.PATCH-prerelease     (ex: 1.2.3-beta.1)
 *   - MAJOR.MINOR  (PATCH=0 implícito) (ex: 2.5  -> normaliza pra 2.5.0)
 *   - MAJOR.MINOR-prerelease           (ex: 2.5-rc.1 -> 2.5.0-rc.1)
 *
 * Internamente sempre normaliza pra forma MAJOR.MINOR.PATCH para garantir
 * comparações consistentes no client Tauri (Fase 3).
 */
const VersionSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(
    /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.-]+)?$/,
    'Use formato semver (ex: 1.2.3, 2.5, 1.2.3-beta.1)'
  )
  .transform((v) => {
    const m = v.match(/^(\d+)\.(\d+)(?:\.(\d+))?(-[a-zA-Z0-9.-]+)?$/);
    if (!m) return v;
    const [, major, minor, patch, pre] = m;
    return `${major}.${minor}.${patch ?? '0'}${pre ?? ''}`;
  });

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
