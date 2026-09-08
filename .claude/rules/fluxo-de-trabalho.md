# Fluxo de trabalho — Central de Jogos

Regras de postura para qualquer tarefa (bug, feature, refactor, jogo novo).

## Antes de qualquer alteração

1. **Leia o `CLAUDE.md`** — é a referência de arquitetura. As decisões em aberto
   (§1) e o contrato `GamePlugin` (§4) valem para tudo.
2. **Identifique a peça afetada** do monorepo (§3): `apps/server`,
   `apps/mobile-web`, `packages/games/<jogo>`, `packages/shared-types`,
   `packages/ui`. Nunca faça a Central importar lógica interna de um jogo.
3. **Aplique as regras de execução:**
   - @.claude/rules/clean-code.md
   - @.claude/rules/tdd.md
   - @.claude/rules/gitflow.md

> Ao criar/alterar uma funcionalidade, **atualize o trecho correspondente** no
> `CLAUDE.md` (roadmap §8, catálogo, decisões) — é documento vivo.

## Quando um hook bloquear uma ação

Os hooks em `.claude/settings.json` bloqueiam (exit 2): commit em `master`,
branch fora do padrão, PR de trabalho com base `master`, lógica de jogo nova sem
teste, muita mudança acumulada sem rodar teste.

**Ao receber um bloqueio: pare.** Não tente contornar por conta própria.

1. Leia a mensagem do hook — ela diz qual regra e o caminho certo.
2. Se o caminho certo é claro (criar o teste primeiro, renomear a branch, mudar a
   base do PR), faça isso.
3. Se você acha que é um caso legítimo de exceção, **explique ao usuário** o que
   quer fazer e por quê, e peça para ele autorizar. Só então arme o token de
   bypass (`node .claude/hooks/tdd-bypass.js "<motivo>"` ou
   `gitflow-bypass.js`) — 1 uso, 15 min.
4. Bypass não é silencioso: cada ação sob bypass emite banner e o hook `Stop`
   resume no fim da resposta.

## Passos pequenos

Não acumule mudanças em vários arquivos sem rodar `npm test` / `npm run lint` no
meio. O ciclo é: teste vermelho → verde → refactor → repete.
