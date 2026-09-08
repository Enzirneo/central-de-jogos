# Git — fluxo do Central de Jogos (checklist de execução)

> Adaptado de um padrão corporativo (InvestSmart / commission-insight) para a
> realidade deste projeto: repositório pequeno, poucas pessoas, sem tracker de
> tasks obrigatório, sem branch de homologação. O que sobrou do padrão original é
> a **regra de ouro** e os **Conventional Commits**.
>
> Parte destas regras é **bloqueada mecanicamente** por
> `.claude/hooks/pre-bash-gitflow.js` (ver seção final). Ao receber um bloqueio:
> pare e alinhe com o usuário (@.claude/rules/fluxo-de-trabalho.md).

---

## Regra de ouro

**Nunca commite trabalho direto em `master`.** O caminho do código é:

```
sua-branch  ──▶  dev  ──▶  master
```

- `dev` é a branch de integração — é onde tudo é juntado e testado.
- `master` é produção — recebe **só** o merge de `dev`, quando está tudo certo.
- A promoção `dev → master` é um merge (`git checkout master && git merge dev`),
  não um commit de trabalho. Fast-forward sempre que possível.

Commitar direto em `dev` é tolerado para mudanças pequenas e óbvias (typo, ajuste
de config, doc). Qualquer coisa com lógica passa por uma branch de trabalho.

## Branches permanentes

| Branch | O que é | Recebe |
|---|---|---|
| `master` | Produção. | Só merge de `dev`. |
| `dev` | Integração. Base de toda branch de trabalho. | Merge das suas branches. |

Não existe `hml`, `release/` nem `bugfix/`. Bug é `fix/`.

## Nome da sua branch

Formato **obrigatório**: `tipo/<descricao-curta>`

- `<descricao-curta>` — kebab-case: só letras minúsculas, números e hífens. Sem
  acento, sem espaço, sem maiúscula.
- Exemplos válidos: `feat/tela-de-ranking`, `fix/reconexao-no-lobby`,
  `chore/atualiza-expo`, `refactor/registry-de-jogos`.

| Tipo | Quando usar |
|---|---|
| `feat/` | Funcionalidade nova (jogo novo, tela, evento). |
| `fix/` | Correção de bug. |
| `chore/` | Manutenção, deps, config, CI. |
| `refactor/` | Melhorar código sem mudar o que ele faz. |
| `docs/` | Documentação (CLAUDE.md, README, estes rules). |
| `test/` | Só testes. |

Regras:
- Uma branch por assunto. Não misture um jogo novo com um refactor do lobby.
- Sempre abra a partir de `dev` **atualizado**
  (`git checkout dev && git pull`).
- Apague a branch depois do merge (`git branch -d <branch>`).

## Passo a passo

1. `git checkout dev && git pull` — sempre antes de criar a branch.
2. `git checkout -b feat/descricao-curta`.
3. Trabalhe; `git status` / `git diff` para ver o que mudou.
4. Commite pequeno e várias vezes (Conventional Commits abaixo).
5. `git push -u origin feat/descricao-curta`.
6. **Rode os checks** antes de pedir revisão / fazer o merge (ver abaixo).
7. Merge em `dev` — direto (`git checkout dev && git merge --no-ff feat/...`) ou
   por PR com base `dev` se quiser revisão.
8. Depois do merge: `git checkout dev && git pull && git branch -d <branch>`.
9. Quando `dev` estiver estável e testada: `git checkout master && git merge dev
   && git push`.

## Branch desatualizada (o `dev` andou)

```
git checkout dev && git pull
git checkout feat/...
git merge dev
```
Resolva conflitos, **rode os checks de novo**, e faça push.

## Mensagem de commit — Conventional Commits

```
<tipo>(<escopo>): <descricao no imperativo, ate 72 caracteres>

[corpo opcional — explique o POR QUE, nao o QUE]
```

- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`,
  `perf`, `style`, `revert`.
- Escopo = a peça do monorepo: `server`, `mobile-web`, `shared-types`, `ui`, ou
  o id do jogo (`game-ito`, `game-template`). Ex:
  - `feat(game-ito): valida numero de jogadores em createInitialState`
  - `fix(server): mantem jogador por 60s apos desconexao`
  - `chore(deps): atualiza colyseus para 0.16.24`
- Imperativo ("adiciona", não "adicionado"), pt-BR ou inglês.
- Quebra de compatibilidade no `GamePlugin`: `feat(shared-types)!: ...` ou rodapé
  `BREAKING CHANGE:`.

## Checks antes de subir

Não há CI validando o merge — se você não rodar, ninguém roda. Da raiz do
monorepo:

```
npm run lint     # tsc --noEmit em todos os workspaces
npm test         # turbo run test (testes dos packages/games/*)
```

Rode de novo depois de resolver conflito de merge (duas branches verdes podem
virar vermelho juntas). Nunca commite `.env`, segredo ou credencial — só
`.env.example`.

## Se abrir PR, ele precisa ter

`## O que muda` (1 frase) · `## Decisão` (por que assim) · `## Como testar`
(passos) · `## Checklist` (lint + testes verdes, sem segredo, base = `dev`).

## Erros comuns (não faça)

Commitar em `master` · abrir PR de trabalho com base `master` · criar branch a
partir de outra branch de trabalho · branch `minhas-alteracoes` (falta
`tipo/`) · commit `"ajustes"` · misturar dois assuntos na mesma branch ·
commitar `.env` · fazer merge sem rodar `npm test` e `npm run lint`.

---

## O que é bloqueado por hook (`pre-bash-gitflow.js`)

| Regra | Bloqueio |
|---|---|
| `git commit` com a branch atual em `master` / `main` | exit 2 |
| Criar branch cujo nome não é `dev`/`master`/`main` e não casa `^(feat\|fix\|chore\|refactor\|docs\|test)/[a-z0-9][a-z0-9-]*$` | exit 2 |
| `gh pr create --base master`/`main` a partir de branch que não é `dev` | exit 2 |

Exceção pontual — **token de arquivo de uso único e com validade**:

```
node .claude/hooks/gitflow-bypass.js "<motivo>" [--uses N] [--minutes M]
```

Cria `.claude/gitflow-bypass.json` (padrão: 1 uso, expira em 15 min). Cada
comando git/gh que **seria bloqueado** consome 1 uso; ao zerar ou expirar, o
token se apaga sozinho. **Confirme com o usuário antes de armar.**

**Não é bloqueado por hook (depende de seguir esta regra):** abrir a branch a
partir de `dev` atualizado; rodar os checks antes de subir; mensagem no padrão
Conventional Commits; apagar a branch após o merge; promover `dev → master` só
com tudo verde.
