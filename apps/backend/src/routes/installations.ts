/**
 * Rotas de telemetria/admin de instalações (autenticadas).
 * GET /  → lista paginada com nome/versão do firmware
 */
import { PaginationQuerySchema } from '@synapse/shared';
import type { FastifyPluginAsync } from 'fastify';

const installationsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/', async (req) => {
    const q = PaginationQuerySchema.parse(req.query);
    const [rows, total] = await Promise.all([
      app.prisma.installation.findMany({
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: { firmware: { select: { name: true, version: true } } },
      }),
      app.prisma.installation.count(),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        firmwareId: r.firmwareId,
        firmwareName: r.firmware?.name ?? null,
        firmwareVersion: r.firmware?.version ?? null,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        status: r.status,
        errorMessage: r.errorMessage,
        clientVersion: r.clientVersion,
        windowsVersion: r.windowsVersion,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    };
  });

  app.get('/stats', async () => {
    const [total, success, failed, lastWeek] = await Promise.all([
      app.prisma.installation.count(),
      app.prisma.installation.count({ where: { status: 'success' } }),
      app.prisma.installation.count({ where: { status: 'failed' } }),
      app.prisma.installation.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    return { total, success, failed, lastWeek };
  });
};

export default installationsRoutes;
