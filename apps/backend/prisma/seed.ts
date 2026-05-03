/**
 * Seed: cria o usuário admin inicial.
 *
 * Variáveis de ambiente:
 *   ADMIN_EMAIL    (ex: admin@synapse.local)
 *   ADMIN_PASSWORD (mínimo 8 caracteres)
 *   ADMIN_NAME     (opcional, default "Administrador")
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Administrador';

  if (!email || !password) {
    console.error(
      '[seed] ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios. Defina no .env e rode novamente.'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('[seed] ADMIN_PASSWORD deve ter no mínimo 8 caracteres.');
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Usuário admin "${email}" já existe. Nada a fazer.`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.create({
    data: { email, password: hash, name },
  });
  console.log(`[seed] Usuário admin criado: ${user.email} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
