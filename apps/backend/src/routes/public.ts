/**
 * Rotas PÚBLICAS (sem autenticação).
 * Usadas pelo frontend público e pelo cliente Tauri:
 *   GET  /api/public/firmwares           → lista firmwares ativos
 *   GET  /api/public/firmwares/:id/file  → download do arquivo (.hex/.bin/...)
 *   POST /api/public/installations       → telemetria do cliente (registra
 *                                          tentativa de instalação)
 */
import { InstallationReportSchema } from '@synapse/shared';
import { createReadStream } from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';

const publicRoutes: FastifyPluginAsync = async (app) => {
  // ----- LISTA pública: somente firmwares ativos -----
  app.get('/firmwares', async () => {
    const items = await app.prisma.firmware.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        fileName: true,
        fileSize: true,
        fileSha256: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return items.map((f) => ({
      ...f,
      isActive: true,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));
  });

  // ----- DOWNLOAD do binário do firmware -----
  app.get<{ Params: { id: string } }>('/firmwares/:id/file', async (req, reply) => {
    const fw = await app.prisma.firmware.findUnique({
      where: { id: req.params.id, isActive: true },
    });
    if (!fw) return reply.code(404).send(app.httpErrors.notFound('Firmware não disponível'));

    const fullPath = app.storage.readPath(fw.storagePath);
    const stream = createReadStream(fullPath);

    reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Length', fw.fileSize)
      .header('Content-Disposition', `attachment; filename="${fw.fileName}"`)
      .header('X-Firmware-SHA256', fw.fileSha256)
      .header('X-Firmware-Version', fw.version);
    return reply.send(stream);
  });

  // ----- TELEMETRIA: cliente reporta status de instalação -----
  app.post('/installations', async (req, reply) => {
    const parsed = InstallationReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Dados inválidos',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }
    const data = parsed.data;

    if (data.firmwareId) {
      const exists = await app.prisma.firmware.count({ where: { id: data.firmwareId } });
      if (!exists) data.firmwareId = undefined;
    }

    const inst = await app.prisma.installation.create({
      data: {
        firmwareId: data.firmwareId ?? null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
        status: data.status,
        errorMessage: data.errorMessage ?? null,
        clientVersion: data.clientVersion ?? null,
        windowsVersion: data.windowsVersion ?? null,
      },
    });
    reply.code(201);
    return { id: inst.id };
  });
};

export default publicRoutes;
