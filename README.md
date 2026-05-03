# Synapse Drive — WebApp

Plataforma web de gestão e distribuição do instalador USBasp + atualizador de firmware (Trozoba) da família **Synapse Drive**.

## Visão geral

```
┌─────────────────────────────┐
│  FRONTEND (Vue 3 + Tailwind) │  → Netlify (drag-and-drop dist)
│  ─ Painel admin (login)      │
│  ─ Upload de firmwares       │
│  ─ Download do instalador    │
│  ─ Dashboard de instalações  │
└───────────────┬──────────────┘
                │ HTTPS REST
┌───────────────▼──────────────┐
│  BACKEND (VPS Docker)        │
│  ─ Fastify + Prisma          │
│  ─ PostgreSQL ISOLADO em     │
│     container dedicado       │
│  ─ Storage de .hex em volume │
│  ─ JWT auth admin            │
└───────────────┬──────────────┘
                │
┌───────────────▼──────────────┐
│  CLIENTE WINDOWS (Tauri)     │  ← Fase 3
│  ─ GUI moderna em Vue        │
│  ─ Subprocess: Zadig, Trozoba│
│  ─ Auto-update via API       │
└──────────────────────────────┘
```

## Stack

| Camada     | Tecnologia                                                       |
|------------|------------------------------------------------------------------|
| Frontend   | Vue 3.5 + Vite 6 + TypeScript + Tailwind CSS + Pinia + Vue Router |
| Backend    | Node 20 + Fastify 5 + Prisma 5 + PostgreSQL 16 + zod + bcrypt    |
| Infra      | Docker Compose + Caddy 2 (proxy reverso + SSL Let's Encrypt)     |
| Cliente    | Tauri (Rust) + Vue 3 + auto-updater (Fase 3)                     |
| Deploy FE  | Netlify (`drive.synapseia.com.br`)                               |
| Deploy BE  | VPS 177.153.38.233 (`api.drive.synapseia.com.br`)                |

## Estrutura

```
synapse-drive-webapp/
├── apps/
│   ├── backend/      ← API Fastify + Prisma
│   └── frontend/     ← SPA Vue 3 (deploy Netlify)
├── packages/
│   └── shared/       ← Tipos TS compartilhados
├── infra/
│   ├── docker-compose.yml
│   ├── caddy/Caddyfile
│   └── .env.example
├── package.json      ← root workspace (scripts orquestrados)
└── pnpm-workspace.yaml
```

## Pré-requisitos

- Node.js **20+**
- pnpm **9+** (`npm install -g pnpm`)
- Docker + Docker Compose v2 (apenas para deploy/dev de banco)

## Setup local (dev)

```bash
cd "c:\App - Dev\synapse-drive-webapp"
pnpm install

# Sobe SOMENTE o postgres dedicado (não mexe em outras instâncias do seu sistema)
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d synapse-postgres

# Roda migrations
pnpm db:migrate

# Cria usuário admin inicial (interativo)
pnpm db:seed

# Inicia backend (porta 3000) e frontend (porta 5173) em paralelo
pnpm dev:backend  # terminal 1
pnpm dev:frontend # terminal 2
```

## Deploy

### Backend (VPS)

```bash
ssh root@177.153.38.233
cd /opt
git clone <repo-url> synapse-drive-webapp
cd synapse-drive-webapp/infra
cp .env.example .env
nano .env                # preenche secrets (JWT_SECRET, POSTGRES_PASSWORD, etc.)
docker compose --env-file .env up -d
docker compose logs -f synapse-backend
```

### Frontend (Netlify)

Há duas opções:

**A) Drag-and-drop** (rápido, manual):

```bash
pnpm build:frontend
# Abra https://app.netlify.com → arraste a pasta apps/frontend/dist
```

**B) Git-based** (recomendado para CI):

1. Push deste repo para GitHub.
2. No Netlify → **Add new site → Import from Git** → selecione o repo.
3. Netlify lê automaticamente `apps/frontend/netlify.toml` (build command + publish dir).
4. Adicione **Environment variables** no painel do Netlify:
   - `VITE_API_BASE_URL` = `https://api.drive.synapseia.com.br`
   - `VITE_APP_NAME` = `Synapse Drive`
   - `VITE_SUPPORT_EMAIL` = `suporte@synapseia.com.br`
5. Em **Domain management**, adicione o domínio `drive.synapseia.com.br` (Netlify cria CNAME automaticamente, já que o DNS do `synapseia.com.br` está delegado ao Netlify).

## Isolamento do banco

⚠️ Este app cria **um Postgres novo, dedicado, em container Docker**. Ele NÃO usa nenhuma instância PostgreSQL pré-existente da VPS. O Postgres deste app:

- Roda em container `synapse-postgres` (imagem `postgres:16-alpine`)
- Usa volume Docker dedicado (`synapse_pg_data`)
- Está em network Docker exclusiva (`synapse-network`)
- **Não publica porta no host** — apenas o backend interno acessa
- Tem limites de RAM/CPU (`512M` / `1.0 cpu`)

Isso garante que falhas, updates ou backups deste app não afetem outras aplicações em produção que compartilhem a VPS.

## Roadmap

- [x] **Fase 1:** Backend Fastify + Prisma + PostgreSQL isolado + Docker Compose
- [x] **Fase 2:** Frontend Vue 3 (login admin, CRUD de firmwares, página pública, dashboard de telemetria)
- [ ] **Fase 2.6:** Deploy real backend (VPS) + frontend (Netlify) + DNS
- [ ] **Fase 3:** Cliente Tauri (GUI substituindo `.bat`/`.ps1`)
- [ ] **Fase 4:** Auto-update do cliente + telemetria avançada
- [ ] **Fase 5:** Code-signing do `.msi` + pipeline CI/CD
