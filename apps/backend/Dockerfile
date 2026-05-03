# =============================================================================
# Synapse Drive Backend - imagem multi-stage com Node 20 LTS Alpine
# =============================================================================

# ---- Stage 1: instalar deps + gerar prisma client ----
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copia arquivos de manifesto do monorepo (cache eficiente)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --filter "@synapse/backend..."

# ---- Stage 2: build (TypeScript -> JS, Prisma generate) ----
FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

COPY package.json pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
RUN pnpm prisma generate
RUN pnpm build

# ---- Stage 3: runtime mínimo ----
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat tini
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copia o monorepo necessário pra runtime
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/backend/package.json ./apps/backend/
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /app/node_modules ./node_modules

WORKDIR /app/apps/backend

# Roda como usuário não-root (segurança)
RUN addgroup -g 1001 -S synapse && adduser -S synapse -u 1001 -G synapse \
    && mkdir -p /app/apps/backend/storage \
    && chown -R synapse:synapse /app
USER synapse

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
# No start, aplica migrations pendentes e sobe o servidor
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
