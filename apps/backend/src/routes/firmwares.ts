import {
  ALLOWED_FIRMWARE_EXTENSIONS,
  FirmwareCreateMetaSchema,
  FirmwareUpdateSchema,
  MAX_FIRMWARE_SIZE,
  PaginationQuerySchema,
} from '@synapse/shared';
import type { FastifyPluginAsync } from 'fastify';
import path from 'node:path';
import { sha256 } from '../lib/hash.js';

const firmwareRoutes: FastifyPluginAsync = async (app) => {
  // Todas as rotas exigem auth (admin)
  app.addHook('onRequest', app.authenticate);

  // ----- LIST -----
  app.get('/', async (req) => {
    const q = PaginationQuerySchema.parse(req.query);
    const [items, total] = await Promise.all([
      app.prisma.firmware.findMany({
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.firmware.count(),
    ]);
    return {
      items: items.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    };
  });

  // ----- GET ONE -----
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const fw = await app.prisma.firmware.findUnique({ where: { id: req.params.id } });
    if (!fw) return reply.code(404).send(app.httpErrors.notFound('Firmware não encontrado'));
    return {
      ...fw,
      createdAt: fw.createdAt.toISOString(),
      updatedAt: fw.updatedAt.toISOString(),
    };
  });

  // ----- CREATE (multipart: meta JSON + arquivo binário) -----
  app.post('/', async (req, reply) => {
    if (!req.isMultipart()) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Use multipart/form-data com campos "meta" (JSON) e "file" (binário).',
        statusCode: 400,
      });
    }

    let metaRaw: string | null = null;
    let fileBuffer: Buffer | null = null;
    let fileName = '';

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const ext = path.extname(part.filename).toLowerCase();
        if (!ALLOWED_FIRMWARE_EXTENSIONS.includes(ext as (typeof ALLOWED_FIRMWARE_EXTENSIONS)[number])) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: `Extensão "${ext}" não permitida. Use: ${ALLOWED_FIRMWARE_EXTENSIONS.join(', ')}`,
            statusCode: 400,
          });
        }
        fileBuffer = await part.toBuffer();
        fileName = part.filename;
        if (fileBuffer.length > MAX_FIRMWARE_SIZE) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: `Arquivo excede o tamanho máximo de ${MAX_FIRMWARE_SIZE} bytes`,
            statusCode: 400,
          });
        }
      } else if (part.fieldname === 'meta') {
        metaRaw = part.value as string;
      }
    }

    if (!metaRaw) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Campo "meta" (JSON) é obrigatório',
        statusCode: 400,
      });
    }
    if (!fileBuffer) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Campo "file" é obrigatório',
        statusCode: 400,
      });
    }

    let metaJson: unknown;
    try {
      metaJson = JSON.parse(metaRaw);
    } catch {
      return reply.code(400).send({
        error: 'Bad Request',
        message: '"meta" não é JSON válido',
        statusCode: 400,
      });
    }

    const parsed = FirmwareCreateMetaSchema.safeParse(metaJson);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Metadados inválidos',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }
    const meta = parsed.data;

    // Garante unicidade (name+version)
    const dup = await app.prisma.firmware.findUnique({
      where: { name_version: { name: meta.name, version: meta.version } },
    });
    if (dup) {
      return reply.code(409).send({
        error: 'Conflict',
        message: `Firmware "${meta.name}" v${meta.version} já existe`,
        statusCode: 409,
      });
    }

    const fileSha256 = sha256(fileBuffer);
    const safeBase = `${meta.name.replace(/[^\w.-]/g, '_')}-${meta.version}${path.extname(fileName)}`;
    const storagePath = path.posix.join('firmwares', `${fileSha256.slice(0, 12)}-${safeBase}`);
    await app.storage.saveBuffer(storagePath, fileBuffer);

    const fw = await app.prisma.firmware.create({
      data: {
        name: meta.name,
        version: meta.version,
        description: meta.description ?? null,
        fileName,
        fileSize: fileBuffer.length,
        fileSha256,
        storagePath,
        isActive: meta.isActive ?? true,
      },
    });

    reply.code(201);
    return {
      ...fw,
      createdAt: fw.createdAt.toISOString(),
      updatedAt: fw.updatedAt.toISOString(),
    };
  });

  // ----- UPDATE (apenas metadados; arquivo é imutável) -----
  app.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const parsed = FirmwareUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Dados inválidos',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }
    try {
      const fw = await app.prisma.firmware.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      return {
        ...fw,
        createdAt: fw.createdAt.toISOString(),
        updatedAt: fw.updatedAt.toISOString(),
      };
    } catch {
      return reply.code(404).send(app.httpErrors.notFound('Firmware não encontrado'));
    }
  });

  // ----- DELETE -----
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const fw = await app.prisma.firmware.findUnique({ where: { id: req.params.id } });
    if (!fw) return reply.code(404).send(app.httpErrors.notFound('Firmware não encontrado'));

    await app.storage.delete(fw.storagePath);
    await app.prisma.firmware.delete({ where: { id: fw.id } });
    return reply.code(204).send();
  });
};

export default firmwareRoutes;
