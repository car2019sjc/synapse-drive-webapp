/**
 * Synapse Drive - Backend API
 * Fastify 5 + Prisma 5 + PostgreSQL (DEDICADO em container Docker isolado)
 */
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';

import { config } from './config.js';

import authPlugin from './plugins/auth.js';
import configPlugin from './plugins/config.js';
import prismaPlugin from './plugins/prisma.js';
import storagePlugin from './plugins/storage.js';

import authRoutes from './routes/auth.js';
import firmwareRoutes from './routes/firmwares.js';
import installationsRoutes from './routes/installations.js';
import publicRoutes from './routes/public.js';

import { MAX_FIRMWARE_SIZE } from '@synapse/shared';

async function buildApp() {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'development'
        ? {
            level: 'info',
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            },
          }
        : { level: 'info' },
    bodyLimit: MAX_FIRMWARE_SIZE + 1024 * 1024, // 1 MB de folga p/ multipart
    trustProxy: true,
  });

  // ---- Plugins de infra ----
  await app.register(configPlugin);
  await app.register(prismaPlugin);
  await app.register(storagePlugin);

  // ---- Plugins HTTP ----
  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      // Permite requisições sem origin (curl, native client, mesmo domínio)
      if (!origin) return cb(null, true);
      if (config.CORS_ORIGINS.includes(origin) || config.CORS_ORIGINS.includes('*')) {
        return cb(null, true);
      }
      cb(new Error(`Origin ${origin} não permitido por CORS`), false);
    },
    credentials: true,
  });
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });
  await app.register(multipart, {
    limits: {
      fileSize: MAX_FIRMWARE_SIZE,
      files: 1,
    },
  });

  // ---- Plugins de aplicação ----
  await app.register(authPlugin);

  // ---- Health checks ----
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));
  app.get('/ready', async () => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      throw app.httpErrors.serviceUnavailable('Banco indisponível');
    }
  });

  // ---- Rotas ----
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(firmwareRoutes, { prefix: '/api/firmwares' });
  await app.register(installationsRoutes, { prefix: '/api/installations' });
  await app.register(publicRoutes, { prefix: '/api/public' });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(
      `🚀 Synapse Drive Backend rodando em http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info(`Recebido ${signal}, encerrando...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main();
