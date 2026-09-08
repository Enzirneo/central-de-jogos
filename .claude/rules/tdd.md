# TDD — regras de execução

> **Fonte:** estudo de *Test-Driven Development by Example* (Kent Beck). Este
> arquivo condensa aquele material em regras de execução. Adaptado do projeto
> commission-insight para o monorepo TypeScript do Central de Jogos.

---

## Por que TDD

TDD é uma forma de **gerenciar o medo** durante a programação — a saída é
**feedback rápido e confiável em passos pequenos.** Os testes são os dentes de
uma catraca: teste que passou, passou para sempre; você nunca perde terreno.

- **TDD é um processo de direção ("steering"):** você regula a distância entre
  decisão e feedback. Tudo tranquilo → passos maiores. Trecho complicado, bug
  estranho → engate a reduzida, passos minúsculos.
- Não é bala de prata: código não-determinístico (rede, concorrência) é onde TDD
  tem aplicação mais difícil.

## As 3 leis do TDD

1. Não escreva **nenhum** código de produção antes de ter um teste que falha.
2. Não escreva **mais teste** do que o suficiente para falhar (não compilar já é falhar).
3. Não escreva **mais código de produção** do que o suficiente para o teste passar.

O ciclo dura de segundos a poucos minutos.

## Regra base neste projeto

> Sem exceção, salvo autorização explícita **na conversa**.

- **Nenhuma lógica de jogo nova sem um teste que falhe primeiro.** "Lógica de
  jogo" = tudo em `packages/games/<nome>/src/` que não seja `index.ts`,
  `types.ts`, `themes.ts` ou `*.test.ts` — na prática, o `GamePlugin` e o que ele
  usa (`createInitialState`, `applyAction`, `isGameOver`, `getResults`,
  `getStateForPlayer`). Isso é o que o CLAUDE.md §6 já exige testar.
- **Fora disso** (`apps/mobile-web`, `apps/server`, `packages/ui`,
  `packages/shared-types`) o TDD não é obrigatório nem bloqueado por hook — o
  projeto é pequeno e essas camadas são finas. Ainda assim: se for escrever uma
  função pura de verdade lá (cálculo, validação, formatação), escreva o teste
  antes; vale a pena.
- **Exceção pontual** só se o usuário autorizar na conversa para aquele passo
  (renomear arquivo, mexer só em tipagem/config/import, spike descartável).
- **Incrementos pequenos e verificados.** Cada passo pequeno o bastante para
  rodar os testes logo em seguida. Não acumule mudanças em vários arquivos sem
  rodar teste no meio. (Reforçado por hook — ver seção final.)

---

## O ciclo: Red → Green → Refactor

Cada fase otimiza uma coisa diferente — **nunca as duas ao mesmo tempo**.

### 🔴 Red — "qual deveria ser a API? como eu gostaria de usar isso?"
- Escreva o **menor** teste que ainda não passa. Comece pelo `assert`
  (*Assert First*): "no fim quero que `resultado == X`" e trabalhe para trás até
  o mínimo de setup.
- **Rode. Tem que falhar — pelo motivo certo:** a asserção do comportamento, com
  "esperava X, veio Y". Se falhou por erro de import/sintaxe/fixture ausente,
  conserte isso primeiro — você ainda não está no Red de verdade.
- Não sabe por onde começar? *Starter Test*: caso degenerado (lista vazia, zero
  jogadores, saída = entrada) só para descobrir onde o código mora.

### 🟢 Green — "como faço passar o mais rápido possível?"
Vale gambiarra. Pecado capital é **ficar preso**: travou > ~2 min, volte para
Fake It e diminua o passo.

1. **Fake It:** devolva a **constante** que o teste espera; depois troque
   constante por variável/expressão, aos poucos.
2. **Triangulação:** só generalize quando tiver **2+ exemplos** que forçam a
   generalização.
3. **Implementação óbvia:** se a solução real é trivial e você tem certeza,
   digite direto. Ao primeiro vermelho inesperado, recue para Fake It.
- ***One to Many:*** operação sobre coleção → primeiro faça funcionar para **um**
  jogador, depois generalize para a lista.

### 🔵 Refactor — "como removo a duplicação sem mudar o comportamento?"
- **Etapa separada.** Nunca refatore com teste vermelho. Nunca misture "melhorar
  estrutura" com "adicionar comportamento" no mesmo passo.
- Alvo nº 1: **duplicação** — inclusive a duplicação **entre teste e código** (o
  dado literal que aparece nos dois).
- Rode os testes depois de **cada** movimento.
- **Reconcile Differences:** para unificar dois trechos parecidos, aproxime-os
  passo a passo até ficarem **idênticos**, e só então una.
- **Migrate Data** (mudar representação do estado do jogo): adicione o formato
  novo → preencha nos dois lugares → passe a ler o novo → apague o antigo → só
  então mude a interface.

---

## O que testar — Test Patterns

- **Test List** *(essencial)*: antes de começar, anote todos os testes que você
  sabe que vai precisar. Ataque **um por vez**; adicione o que descobrir. A
  sessão acaba quando a lista zera. Para um jogo novo, a lista sai das regras do
  jogo: estado inicial, cada ação válida, ações inválidas ignoradas, condição de
  fim, empate, placar.
- **Isolated Test** *(essencial)*: zero dependência entre testes; ordem não
  importa; cada teste monta e desmonta o próprio mundo.
- **Test-First** *(essencial)*: teste antes do código.
- **Assert First** *(frequente)*: escreva o `assert` antes do resto do teste.
- **Test Data** *(frequente)*: dados que tornam o teste **fácil de ler**, não
  "realistas". `["p1", "p2"]` basta — não invente nomes de jogador de verdade.
  Lista de 3 leva às mesmas decisões que lista de 10.
- **Evident Data** *(situacional)*: deixe visível a relação entrada→saída no
  próprio teste.

## Processo — quando/onde parar

- **One Step Test** *(frequente)*: da lista, escolha o teste que te **ensina algo
  E** que você tem confiança de implementar.
- **Regression Test** *(essencial)*: todo bug reportado vira **primeiro** o menor
  teste que o reproduz (falha), depois o conserto (passa).
- **Child Test** *(frequente)*: teste grande demais para ficar verde de uma vez →
  escreva um teste menor só com a parte quebrada, resolva, reintroduza o grande.
- **Broken Test vs. Clean Check-in:** sozinho, pode terminar a sessão com um
  teste **quebrado** de propósito (bilhete para você mesmo). Antes de mergear em
  `dev`, **nunca** — suíte verde.

## Técnicas de teste

- **Mock Object** *(essencial)*: recurso caro/externo (Redis, Postgres, socket
  Colyseus) → versão falsa que devolve respostas fixas. O `GamePlugin` é lógica
  pura e **não deve tocar nesses recursos** — teste-o direto, sem mock. Se
  precisar de mock, provavelmente a lógica vazou para fora do plugin.
- **Self Shunt / Log String / Crash Test Dummy** *(situacional)*: ver o material
  de origem se precisar.

## Design patterns que emergem via TDD

- **Value Object** *(essencial)*: estado definido na criação, **nunca muda**;
  toda operação devolve um objeto novo. É exatamente o contrato do `GamePlugin`
  neste projeto — `applyAction(state, ...)` **retorna** o novo estado, não muta o
  recebido. Elimina *aliasing*.
- **Null Object** *(frequente)*: caso especial vira objeto com o mesmo protocolo
  dos normais — elimina `if (x != null)` espalhado.
- **Collecting Parameter:** para juntar resultados espalhados, passe um
  acumulador como parâmetro.

## Lições dos exemplos completos

- **Comece pelo comportamento, não pelos objetos.** "Que testes, se passarem,
  provam que o jogo funciona?" — não "que classes eu preciso?".
- **Variação que vira dado (campo) em vez de tipo (classe) faz a hierarquia
  desaparecer.** "Isso é um tipo diferente de objeto, ou só um valor diferente do
  mesmo objeto?"
- **Pergunte ao computador.** Em vez de deduzir se uma mudança quebra algo, faça
  a mudança e rode os testes.
- **`instanceof` / checagem de tipo no meio da lógica = falta um método na
  interface.** Troque por polimorfismo.
- **Passos minúsculos são a única forma confiável de não se perder** quando não
  há rede de segurança.

## Maestria — critérios

- **Quantos testes escrever?** Critério = quanta confiança este código exige.
  Overflow num contador que nunca chega perto do limite = esforço num risco que
  não existe. "Se seu conhecimento da implementação já te dá confiança sem o
  teste, não escreva o teste." — mas a lógica central de cada jogo **sempre**
  exige teste.
- **Quando apagar testes?** Só se dois provam exatamente a mesma coisa.

---

## Aplicação neste repo

- **Runner:** `node:test` via `tsx --test`. Um jogo tem `src/<nome>-game.ts` e
  `src/<nome>-game.test.ts` lado a lado (ver `packages/games/_template/` e
  `packages/games/ito/`).
- **Rodar:** `npm test` dentro de `packages/games/<nome>/`, ou `npm test` na raiz
  para todos via Turborepo.
- **Jogo novo:** copie `packages/games/_template/`. A Test List sai das regras do
  jogo; ataque `createInitialState` → `applyAction` (uma ação por vez) →
  `isGameOver` → `getResults` → `getStateForPlayer`.
- **`options` chega do cliente:** todo `createInitialState` precisa de um teste
  que passa `options` inválido e verifica que ele é rejeitado/saneado (CLAUDE.md
  §4).
- Antes de mexer numa regra de um jogo existente, releia os `types.ts`/`themes.ts`
  dele e transforme cada regra num item da Test List.

---

## O que é travado por hook vs. o que depende de você

**Travado por hook (exit 2 — a ação não acontece):**

| Regra | Hook |
|---|---|
| Existe um teste antes de escrever lógica nova em `packages/games/*/src` | `pre-edit-tdd.js` (caso A) |
| Não seguir editando **outro** arquivo de jogo enquanto há teste vermelho pendente | `pre-edit-tdd.js` (caso B) + `.claude/tdd-state.json` |
| Não acumular muita mudança (> ~40 linhas / > 2 arquivos) sem rodar teste | `pre-edit-tdd.js` (caso C) |
| Rodar `tsc --noEmit` + a suíte do pacote após cada edição e registrar o resultado | `post-edit-verify.js` |

Exceção pontual — **token de arquivo de uso único e com validade**:

```
node .claude/hooks/tdd-bypass.js "<motivo>" [--uses N] [--minutes M]
```

Cria `.claude/tdd-bypass.json` (padrão: 1 uso, expira em 15 min). **Confirme com
o usuário antes de armar.** Sem token no disco = enforcement ativo. Cada edit sob
bypass emite banner; o `Stop` hook lembra quantas ações rodaram sob bypass.

**Depende de você seguir esta regra (nenhum script verifica):**

- O teste vermelho falha **pelo motivo certo** (asserção de comportamento).
- Qual estratégia usar no Green e não ficar preso.
- Fazer o **Refactor como etapa separada** e eliminar a duplicação (inclusive
  teste↔código).
- O teste cobrir o **comportamento certo** (a regra do jogo), não só "passar".
- Manter a Test List, atacar um caso por vez, passos pequenos, testes isolados.
- Bug reportado vira Regression Test **antes** do conserto.
