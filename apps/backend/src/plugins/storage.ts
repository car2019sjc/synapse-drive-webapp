/**
 * Storage local de arquivos de firmware.
 *
 * Por simplicidade, salva os .hex no diretório STORAGE_DIR (montado como
 * volume Docker em produção). O backend gerencia o ciclo de vida e o
 * caminho relativo dentro de STORAGE_DIR é o que vai pra coluna
 * `storage_path` da tabela firmwares.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    storage: {
      rootDir: string;
      saveBuffer(relativePath: string, buffer: Buffer): Promise<void>;
      readPath(relativePath: string): string;
      delete(relativePath: string): Promise<void>;
    };
  }
}

const storagePlugin: FastifyPluginAsync = async (app) => {
  const rootDir = path.resolve(app.config.STORAGE_DIR);
  await fs.mkdir(rootDir, { recursive: true });
  app.log.info({ rootDir }, 'storage: diretório pronto');

  /** Garante que `relativePath` não escape de `rootDir` (path traversal). */
  const safeJoin = (rel: string): string => {
    const full = path.resolve(rootDir, rel);
    if (!full.startsWith(rootDir + path.sep) && full !== rootDir) {
      throw new Error(`Caminho inválido (path traversal detectado): ${rel}`);
    }
    return full;
  };

  app.decorate('storage', {
    rootDir,
    saveBuffer: async (rel, buf) => {
      const full = safeJoin(rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, buf);
    },
    readPath: (rel) => safeJoin(rel),
    delete: async (rel) => {
      try {
        await fs.unlink(safeJoin(rel));
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    },
  });
};

export default fp(storagePlugin, { name: 'storage', dependencies: ['config'] });
