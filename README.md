# Central de Jogos

Plataforma multiplayer local/remoto no estilo Jackbox Games. Veja [CLAUDE.md](./CLAUDE.md) para a arquitetura completa do projeto.

> ⚠️ **Migração de stack em andamento** — os clientes estão sendo trocados por
> Angular (web) e Flutter (mobile). Ver [docs/PLANO_MIGRACAO_ANGULAR_FLUTTER.md](./docs/PLANO_MIGRACAO_ANGULAR_FLUTTER.md).

## Estrutura

```
apps/
  server/     # Servidor Colyseus (Node.js) — fonte da verdade
  web/        # App Angular (Fase 2, em andamento)
  mobile/     # App Flutter (Fase 3, ainda não criado)
packages/
  protocol/   # Contrato: tipos, nomes de evento, schemas zod (compartilhado no lado TS)
  games/      # Um jogo por pasta, plugável na Central
```

## Ambiente de desenvolvimento

- **Node 22** (o Angular CLI 20 exige). Use o `.nvmrc`: `nvm use`. As versões de
  pacote ficam travadas em `package-lock.json` — sempre `npm ci` (não `npm install`)
  pra reproduzir a árvore exata.
- **Servidor + bancos**: `docker compose up` sobe servidor + Postgres 16 + Redis 7
  juntos. É o único uso de Docker no projeto (ver `CLAUDE.md` §7).
- **Só o servidor, sem Docker**: `npm run dev` — sobe o Colyseus; Postgres/Redis
  aparecem como desconectados, mas lobby e jogos funcionam.
- **Cliente web**: `npm run dev -w @central-de-jogos/web` → http://localhost:4200
- **Checagens** (as mesmas do CI): `npm run lint` e `npm test` na raiz.
- **Flutter** (Fase 3): SDK travado por `fvm` quando `apps/mobile` existir.

## Rodando o servidor localmente (Docker)

O servidor (`apps/server`) roda em Docker junto com Postgres e Redis. Esse é o único componente do projeto que usa Docker — os clientes (Angular/Flutter) **não** são containerizados.

1. Copie o arquivo de variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   Os valores padrão já funcionam para desenvolvimento local — não precisa editar nada, a menos que queira mudar portas ou credenciais.

2. Suba os três serviços (servidor + Postgres 16 + Redis 7):
   ```
   docker compose up
   ```
   Na primeira vez, isso builda a imagem do servidor (multi-stage: instala dependências e compila o TypeScript, depois gera uma imagem enxuta só com o `dist/` compilado). Nas próximas, reaproveita o cache — para forçar rebuild depois de mudar dependências, use `docker compose up --build`.

3. O servidor sobe em `ws://localhost:2567`.

### Verificando se servidor, Postgres e Redis estão conectados entre si

O servidor expõe `GET /health`, que testa a conexão com os dois serviços em tempo real e retorna o status de cada um:

```
curl http://localhost:2567/health
```

Resposta esperada:
```json
{ "ok": true, "postgres": true, "redis": true }
```

Também dá pra conferir pelos logs do próprio servidor (`docker compose logs server`), que imprime `[postgres] conectado: true/false` e `[redis] conectado: true/false` ao subir. E `docker compose ps` mostra o status `healthy` de cada container assim que os healthchecks do Postgres/Redis passam — o servidor só é iniciado depois que os dois ficam saudáveis.

Para derrubar tudo:
```
docker compose down
```

## Produção

O servidor builda o `Dockerfile` de `apps/server/Dockerfile` sem alteração,
apontando para Postgres/Redis gerenciados via variáveis de ambiente
(`DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`). A hospedagem será decidida na Fase 4
(ver o plano de migração). O `docker-compose.yml` da raiz é usado **só** em
desenvolvimento local.

## Clientes

- **`apps/web`** (Angular) — criado na Fase 2. Deploy estático na Vercel, sem Docker.
- **`apps/mobile`** (Flutter) — criado na Fase 3. `flutter run` em Android; sem Docker.

Enquanto não existem, use o `docs/contrato-wire.md` (Fase 0) para saber o que o
servidor fala.
