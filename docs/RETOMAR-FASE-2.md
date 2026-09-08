# Prompt para retomar — Central de Jogos, Fase 2

Cole isto no início da conversa nova:

---

Continuando a migração de stack do **Central de Jogos** (React/Expo → Angular + Flutter).

**Antes de mexer em qualquer coisa, leia nesta ordem:**
1. `CLAUDE.md` (arquitetura + regras de execução)
2. `docs/PLANO_MIGRACAO_ANGULAR_FLUTTER.md` — o plano; a seção 12 (Progresso) diz
   exatamente o que está feito e o que falta. Procure por "RETOMAR AQUI".
3. `docs/contrato-wire.md` — o protocolo WebSocket (fonte da verdade dos eventos)
4. `.claude/rules/*` — gitflow, tdd, clean-code, fluxo-de-trabalho

**Onde estamos:** branch `dev`. Fases 0 e 1 concluídas. Fase 2 (cliente Angular
em `apps/web`) em andamento — já feitos: scaffold, design system (`shared/ui/`),
`core/colyseus/` (ColyseusService + RoomStore em signals), telas de
home / lobby / ready-check. O protocolo já foi validado ponta a ponta com
`colyseus.js` real contra o servidor.

**Próxima tarefa: `feat/web-game-host`**
- Criar `apps/web/src/app/core/colyseus/game-registry.ts`: um mapa
  `id do catálogo → () => import(componente do jogo)`, espelhando
  `apps/server/src/games/registry.ts`.
- O `features/game-host/game-host.ts` (hoje um placeholder que mostra JSON) passa
  a fazer `import()` dinâmico do componente do jogo ativo (`store.activeGameId()`).
- Tela de resultados: quando `store.results()` tem valor, mostra o placar +
  `burstConfetti()` (já existe em `shared/ui/confetti.ts`) + botão "jogar de novo".
- Fazer o jogo `_template` (Contador) rodar de ponta a ponta primeiro:
  criar `features/games/contador/contador.ts` que lê `store.gameState()` e
  manda `store.sendAction({ type: 'increment' })`.

**Regras de trabalho:**
- Uma branch por passo, a partir de `dev` (`feat/...`, `fix/...`, etc.), merge
  `--no-ff` de volta em `dev`. Nunca commitar em `master`.
- `apps/web` importa `@central-de-jogos/protocol` pelo **código-fonte** (já
  configurado em `tsconfig` paths) — se adicionar outra dep de `packages/*`,
  fazer igual.
- Rodar antes de cada merge: `npm run lint` e `npm test` na raiz (os dois
  precisam ficar verdes — é o que o CI roda).
- Conventional Commits. Terminar a mensagem de commit com:
  `Co-Authored-By: Claude <noreply@anthropic.com>`

**Como testar na mão:** dois terminais — `npm run dev` (servidor) e
`npm run dev -w @central-de-jogos/web` (abre em http://localhost:4200).
Criar sala numa aba, entrar por código em outra, escolher o Contador,
ficar pronto, jogar.
