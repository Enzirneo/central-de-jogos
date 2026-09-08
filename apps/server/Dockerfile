# Build context é a raiz do monorepo (necessário para o npm workspaces resolver
# os pacotes compartilhados). Buildar com:
#   docker build -f apps/server/Dockerfile -t central-de-jogos-server .
# O docker-compose.yml na raiz já faz isso automaticamente.

# ---- Stage 1: instala dependências e compila o TypeScript ----
FROM node:22-alpine AS builder
WORKDIR /app

# Manifests de todo o monorepo primeiro, para aproveitar o cache de camadas
# do Docker enquanto o código-fonte muda com mais frequência que as dependências.
COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/protocol/package.json packages/protocol/package.json
COPY packages/games/_template/package.json packages/games/_template/package.json
COPY packages/games/ito/package.json packages/games/ito/package.json

# Instala só o necessário para o workspace do servidor.
RUN npm ci --workspace=@central-de-jogos/server --include-workspace-root

COPY apps/server apps/server
COPY packages/protocol packages/protocol
COPY packages/games/_template packages/games/_template
COPY packages/games/ito packages/games/ito

# Usa o turbo (já vem no devDependencies da raiz) pra compilar protocol e os
# jogos antes do servidor, na ordem certa, seguindo o grafo de dependências
# entre os workspaces.
RUN npx turbo run build --filter=@central-de-jogos/server

# Remove devDependencies antes de copiar para a imagem final
RUN npm prune --omit=dev --workspace=@central-de-jogos/server --include-workspace-root

# ---- Stage 2: imagem enxuta só com o necessário para rodar ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/server/package.json apps/server/package.json
COPY --from=builder /app/apps/server/dist apps/server/dist

# node_modules/@central-de-jogos/* são symlinks pra essas pastas — sem
# copiá-las, o `require()` em produção quebra (link pendurado no vazio).
COPY --from=builder /app/packages/protocol/package.json packages/protocol/package.json
COPY --from=builder /app/packages/protocol/dist packages/protocol/dist
COPY --from=builder /app/packages/games/_template/package.json packages/games/_template/package.json
COPY --from=builder /app/packages/games/_template/dist packages/games/_template/dist
COPY --from=builder /app/packages/games/ito/package.json packages/games/ito/package.json
COPY --from=builder /app/packages/games/ito/dist packages/games/ito/dist

EXPOSE 2567
CMD ["node", "apps/server/dist/index.js"]
