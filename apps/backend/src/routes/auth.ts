import { LoginRequestSchema } from '@synapse/shared';
import type { FastifyPluginAsync } from 'fastify';
import { verifyPassword } from '../lib/passwords.js';

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (req, reply) => {
    const parsed = LoginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Dados inválidos',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;

    const user = await app.prisma.adminUser.findUnique({ where: { email } });
    // Hash dummy mantém tempo de resposta constante mesmo com user inexistente
    const dummyHash = '$2a$12$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTU';
    const isValid = user
      ? await verifyPassword(password, user.password)
      : (await verifyPassword(password, dummyHash), false);

    if (!user || !isValid) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'E-mail ou senha incorretos',
        statusCode: 401,
      });
    }

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  });

  app.get('/me', { onRequest: [app.authenticate] }, async (req) => {
    const user = await app.prisma.adminUser.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      throw app.httpErrors.notFound('Usuário não encontrado');
    }
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  });
};

export default authRoutes;
