/**
 * Tipos e schemas (zod) compartilhados entre backend (Fastify) e
 * frontend (Vue). Garantem que validação e shape de DTO sejam idênticos
 * dos dois lados.
 */
export * from './schemas/auth.js';
export * from './schemas/firmware.js';
export * from './schemas/installation.js';
export * from './schemas/common.js';
