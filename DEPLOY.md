# Deploy do backend Synapse Drive na VPS

Guia passo-a-passo (≈10 minutos) para subir o backend numa VPS Linux com Docker.

## Pré-requisitos na VPS

- Docker + Docker Compose v2 instalados
- Portas **80** e **443** do host livres (Caddy precisa pra SSL automático)
- DNS `api.drive.synapseia.com.br` apontando para o IP da VPS

## 1. Criar o registro DNS

No **Netlify DNS** (`synapseia.com.br`), criar:

| Type | Name        | Value           |
|------|-------------|-----------------|
| A    | `api.drive` | `177.153.38.233` |

> Aguarde 1–2 minutos pra propagar. Pode testar com `dig +short api.drive.synapseia.com.br` na VPS.

## 2. Conectar na VPS e clonar o repositório

```bash
ssh root@177.153.38.233

# Cria diretório dedicado e clona
mkdir -p /opt
cd /opt
git clone https://github.com/car2019sjc/synapse-drive-webapp.git
cd synapse-drive-webapp/infra
```

## 3. Conferir se as portas 80/443 estão livres

```bash
ss -tln | grep -E ':(80|443)\s'
```

- **Sem saída** → portas livres, pode prosseguir.
- **Com saída** → existe outro proxy ouvindo. Veja qual processo:
  ```bash
  ss -tlnp | grep -E ':(80|443)\s'
  ```
  Se for `synapse-lite-nginx` ou outro nginx que serve várias apps suas, **NÃO faça o deploy ainda**: avise pra adaptarmos. Subir o Caddy aqui vai falhar porque não consegue alocar 80/443.

## 4. Rodar o deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

O script faz tudo automaticamente:

1. Verifica pré-requisitos
2. Gera `.env` com **secrets aleatórios fortes** (Postgres, JWT, senha do admin)
3. Builda imagem do backend
4. Sobe `synapse-postgres`, `synapse-backend` e `synapse-caddy`
5. Aguarda Postgres ficar healthy
6. Aplica migrations Prisma
7. Cria usuário admin inicial (mostra a senha gerada na tela)
8. Faz health check

> ⚠️ **GUARDE A SENHA DO ADMIN** que aparece na tela — ela só é mostrada uma vez.

## 5. Aguardar o SSL automático (Caddy + Let's Encrypt)

Caddy vai requisitar o certificado automaticamente. Acompanhe os logs:

```bash
docker logs -f synapse-caddy
```

Espere ver:

```
[INFO] obtaining certificate for api.drive.synapseia.com.br
[INFO] certificate obtained successfully
```

Pode levar 30s a 2 min na primeira vez. Quando aparecer, o site está com SSL.

## 6. Testes

```bash
# Local na VPS (sem SSL):
curl http://127.0.0.1/health        # via Caddy (apos challenge HTTP-01 finalizar)
curl http://127.0.0.1:80/health     # idem

# De qualquer lugar (com SSL automatico):
curl https://api.drive.synapseia.com.br/health
# Esperado: {"status":"ok","uptime":<segundos>}

curl https://api.drive.synapseia.com.br/ready
# Esperado: {"status":"ready"}
```

## 7. Atualizar o frontend pra apontar pra esta API

O `apps/frontend/.env.production` já está com:

```
VITE_API_BASE_URL=https://api.drive.synapseia.com.br
```

Se você já fez o build antes da API estar no ar, **rode o build de novo** localmente e refaça o drag-and-drop:

```powershell
cd "C:\App - Dev\synapse-drive-webapp"
pnpm --filter @synapse/frontend build
```

Depois arrasta `apps/frontend/dist` no Netlify (área "Deploys" do site).

## 8. Adicionar a URL do Netlify ao CORS

Edite `infra/.env` na VPS pra liberar a URL pública do frontend:

```
CORS_ORIGINS=https://drive.synapseia.com.br,https://dashing-llama-8650c6.netlify.app
```

Recarregue só o backend (não precisa rebuildar):

```bash
docker compose --env-file .env restart synapse-backend
```

## Manutenção

| Ação                 | Comando                                                          |
|----------------------|------------------------------------------------------------------|
| Ver status           | `docker compose --env-file .env ps`                              |
| Logs em tempo real   | `docker compose --env-file .env logs -f`                         |
| Logs só do backend   | `docker logs -f synapse-backend`                                 |
| Reiniciar backend    | `docker compose --env-file .env restart synapse-backend`         |
| Atualizar código     | `git pull && docker compose --env-file .env up -d --build`       |
| Parar tudo           | `docker compose --env-file .env down`                            |
| Apagar TUDO (zera)   | `docker compose --env-file .env down -v` ⚠️ apaga banco também    |
| Ver senhas atuais    | `cat .env`                                                       |
| Backup do banco      | `docker exec synapse-postgres pg_dump -U synapse_app synapse_drive > backup.sql` |

## Solução de problemas

### Caddy não consegue obter certificado

**Causa comum:** DNS ainda não propagou.

```bash
# Confirme que o DNS aponta pro IP correto:
dig +short api.drive.synapseia.com.br
# Deve retornar 177.153.38.233
```

Se estiver correto e ainda assim falhar, veja os logs:

```bash
docker logs synapse-caddy 2>&1 | tail -30
```

Erros comuns:

- `cant assign requested address` → porta 80/443 ocupada por outro processo
- `timeout` → firewall bloqueando 80/443 (libere com `ufw allow 80,443/tcp`)
- `unauthorized` → DNS aponta pra outro IP

### Backend não responde

```bash
docker logs synapse-backend
```

- `❌ Variáveis de ambiente inválidas` → algum campo ficou vazio no `.env`
- `Connection refused` ao Postgres → veja `docker logs synapse-postgres`

### Voltar a uma versão anterior

```bash
cd /opt/synapse-drive-webapp
git log --oneline | head -5
git checkout <commit-hash>
cd infra
docker compose --env-file .env up -d --build
```
