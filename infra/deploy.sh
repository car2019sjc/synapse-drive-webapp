#!/usr/bin/env bash
# =============================================================================
# Synapse Drive WebApp - script de deploy idempotente para a VPS.
#
# Uso (na VPS, dentro de /opt/synapse-drive-webapp/infra):
#   chmod +x deploy.sh
#   ./deploy.sh
#
# O script:
#   1) Verifica pre-requisitos (Docker, portas livres)
#   2) Gera .env com secrets aleatorios (so na primeira vez)
#   3) Builda imagens
#   4) Sobe stack (postgres + backend + caddy)
#   5) Roda prisma migrate deploy
#   6) Roda prisma seed (cria admin inicial)
#   7) Faz health check
# =============================================================================
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$INFRA_DIR"

# ----- Cores p/ output legivel -----
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $*"; }
fatal() { echo -e "${RED}[deploy] ERRO:${NC} $*" >&2; exit 1; }

# =============================================================================
# 1) Pre-requisitos
# =============================================================================
info "Verificando pre-requisitos..."
command -v docker >/dev/null 2>&1 || fatal "docker nao encontrado"
docker compose version >/dev/null 2>&1 || fatal "docker compose v2 nao disponivel"

# Esta stack usa TLS-ALPN-01 challenge (Let's Encrypt via porta 443),
# entao SO precisamos da porta 443 livre. Porta 80 pode estar usada por
# outro proxy/nginx existente na VPS sem conflito.
if [[ -f .env ]]; then
    HTTPS_PORT=$(grep -E '^CADDY_HTTPS_PORT=' .env | cut -d= -f2 || echo "443")
else
    HTTPS_PORT=443
fi

if ss -tln 2>/dev/null | awk '{print $4}' | grep -E ":${HTTPS_PORT}$" >/dev/null; then
    if ! docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null | grep -q "synapse-caddy.*:${HTTPS_PORT}->"; then
        fatal "Porta ${HTTPS_PORT} ja esta em uso por outro processo. Veja com: ss -tlnp | grep :${HTTPS_PORT}"
    fi
fi
info "Porta ${HTTPS_PORT} (HTTPS) OK."

# =============================================================================
# 2) .env: gera secrets fortes na primeira execucao
# =============================================================================
if [[ ! -f .env ]]; then
    info "Arquivo .env nao existe. Gerando com secrets aleatorios..."
    [[ -f .env.example ]] || fatal ".env.example nao encontrado"
    cp .env.example .env

    # Gera secrets seguros
    PG_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 28)
    JWT=$(openssl rand -hex 32)
    ADM_PASS=$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16)

    # Substitui no .env
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_PASS}|" .env
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" .env
    sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADM_PASS}|" .env

    info "Secrets gerados. Salvos em ./.env (NAO comite)."
    echo
    echo "==================== CREDENCIAIS GERADAS ===================="
    echo "Login do painel (api.drive.synapseia.com.br):"
    echo "  Email:  $(grep -E '^ADMIN_EMAIL=' .env | cut -d= -f2)"
    echo "  Senha:  ${ADM_PASS}"
    echo
    echo "Postgres (somente uso interno do backend):"
    echo "  Senha:  ${PG_PASS}"
    echo
    echo "JWT secret: (gerado, 64 chars hex)"
    echo "============================================================="
    echo
    warn "GUARDE A SENHA DO ADMIN ACIMA! Ela nao sera exibida de novo."
    echo
    read -p "Pressione ENTER para continuar com o deploy..."
else
    info "Arquivo .env ja existe, mantendo secrets atuais."
fi

# =============================================================================
# 3) Build das imagens (backend)
# =============================================================================
info "Buildando imagens Docker (pode demorar 1-3 min na primeira vez)..."
docker compose --env-file .env build

# =============================================================================
# 4) Sobe stack
# =============================================================================
info "Subindo postgres + backend + caddy..."
docker compose --env-file .env up -d

# =============================================================================
# 5) Aguarda postgres ficar saudavel
# =============================================================================
info "Aguardando postgres ficar saudavel..."
for i in $(seq 1 30); do
    if docker exec synapse-postgres pg_isready -U "$(grep -E '^POSTGRES_USER=' .env | cut -d= -f2)" >/dev/null 2>&1; then
        info "Postgres OK (tentativa $i)."
        break
    fi
    sleep 2
    if [[ $i -eq 30 ]]; then
        fatal "Postgres nao ficou pronto em 60s. Veja logs: docker logs synapse-postgres"
    fi
done

# =============================================================================
# 6) Migracoes Prisma + seed
#    (o ENTRYPOINT do container ja roda `prisma migrate deploy` no startup,
#     mas executamos explicitamente pra ter feedback no script)
# =============================================================================
info "Rodando migracoes Prisma (idempotente)..."
docker exec synapse-backend sh -c 'cd /app/apps/backend && pnpm prisma:migrate:deploy' || \
    warn "Migracoes nao foram aplicadas via exec (provavelmente ja foram pelo CMD do container). Continuando..."

info "Rodando seed (cria admin se nao existir)..."
docker exec \
  -e ADMIN_EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | cut -d= -f2)" \
  -e ADMIN_PASSWORD="$(grep -E '^ADMIN_PASSWORD=' .env | cut -d= -f2)" \
  -e ADMIN_NAME="$(grep -E '^ADMIN_NAME=' .env | cut -d= -f2-)" \
  synapse-backend sh -c 'cd /app/apps/backend && pnpm prisma:seed'

# =============================================================================
# 7) Health check
# =============================================================================
info "Aguardando backend ficar saudavel..."
sleep 3
for i in $(seq 1 20); do
    if docker exec synapse-backend wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1; then
        info "Backend OK (tentativa $i)."
        break
    fi
    sleep 2
    if [[ $i -eq 20 ]]; then
        warn "Backend ainda nao respondeu /health. Veja: docker logs synapse-backend"
    fi
done

echo
info "==================== DEPLOY CONCLUIDO ===================="
info "Status dos containers:"
docker compose --env-file .env ps
echo
info "Teste rapido:"
info "  curl https://api.drive.synapseia.com.br/health   (apos DNS propagar)"
info "  curl http://127.0.0.1/health                     (local na VPS)"
echo
info "Logs em tempo real:    docker compose --env-file .env logs -f"
info "Reiniciar backend:     docker compose --env-file .env restart synapse-backend"
info "Parar tudo:            docker compose --env-file .env down"
info "============================================================"
