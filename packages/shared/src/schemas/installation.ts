import { z } from 'zod';

export const InstallationStatusEnum = z.enum(['started', 'success', 'failed']);
export type InstallationStatus = z.infer<typeof InstallationStatusEnum>;

export const InstallationSchema = z.object({
  id: z.string().uuid(),
  firmwareId: z.string().uuid().nullable(),
  firmwareName: z.string().nullable(),
  firmwareVersion: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  status: InstallationStatusEnum,
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
});
export type Installation = z.infer<typeof InstallationSchema>;

/** Telemetria enviada pelo cliente Tauri (futuro) ou pelo instalador. */
export const InstallationReportSchema = z.object({
  firmwareId: z.string().uuid().optional(),
  status: InstallationStatusEnum,
  errorMessage: z.string().max(2000).optional().nullable(),
  clientVersion: z.string().max(40).optional(),
  windowsVersion: z.string().max(120).optional(),
});
export type InstallationReport = z.infer<typeof InstallationReportSchema>;
