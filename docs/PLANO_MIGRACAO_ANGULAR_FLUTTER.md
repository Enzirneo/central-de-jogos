# Plano de migração — Angular (web) + Flutter (mobile)

> **Status:** planejamento. Nada aqui foi executado ainda. Este documento é a
> referência completa para a migração; ao executar, siga fase por fase e vá
> marcando o progresso no fim.
>
> **Objetivo do usuário:** trocar as tecnologias de cliente para **treinar
> Angular e Flutter**. O produto (plataforma multiplayer estilo Jackbox, salas,
> jogos plugáveis) **não muda**.

---

## 0. Decisões travadas

Fechadas com o usuário na fase de planejamento. As seções seguintes já refletem
todas elas.

| # | Assunto | Decisão |
|---|---|---|
| 1 | Protocolo cliente↔servidor | **JSON puro.** Sem `@colyseus/schema` entre servidor e clientes (ver §2.1). |
| 2 | Runner de teste do Angular | **Vitest.** |
| 3 | Estado no Flutter | **Riverpod.** |
| 4 | iOS | **Fora de escopo por enquanto.** Sem Codemagic, sem runner macOS, sem custo. Desenvolvimento e testes só em Android (emulador ou aparelho). O código Flutter continua compatível com iOS; só o "empacotar/publicar" fica adiado. |
| 5 | Contrato TS↔Dart | **À mão.** `docs/contrato-wire.md` como fonte + modelos escritos nos dois lados. Sem codegen. |
| 6 | SSR / página pública (Angular) | **Não.** App puro, sem SSR. |
| 7 | Versão do contrato | **Regra de trabalho:** toda mudança no contrato mexe em servidor + Angular + Flutter na mesma branch/PR, com commit `feat(protocol)!:` / `BREAKING CHANGE:`. |
| 8 | Autenticação | **Adiada.** MVP: entrar com apelido, jogar, sair. Contas entram como camada depois. O campo `accountId` em `PlayerState` fica reservado. |
| 9 | Código gerado do Flutter (`*.g.dart`, `*.freezed.dart`) | **Versionar** (vão pro Git). |
| 10 | Nome das pastas | **`apps/web`** (Angular) + **`apps/mobile`** (Flutter). A pasta `apps/mobile-web` some. |
| 11 | CI | **Adicionar** um workflow GitHub Actions rodando `npm test` + `npm run lint` + `flutter test` a cada push/PR (Fase 0). |
| 12 | Build Android automatizado | **Não agora.** `flutter build apk` local quando precisar. Pipeline só quando for distribuir de verdade. |

**Ainda em aberto** (não bloqueiam começar — ver §11):

- **Hospedagem do servidor** — decidir na Fase 4. Web (Angular) já é Vercel (grátis).
  Servidor precisa de host com processo sempre ligado + Redis + Postgres; Railway é
  pago. Candidatos: Fly.io (cota grátis), Render (pago ~US$7 — o grátis hiberna),
  VPS (~US$5/mês). O `Dockerfile` não muda, então dá pra escolher depois.
- **Identidade visual** dos apps — o usuário fornece uma referência no início da
  Fase 2; o design system (tokens + componentes-base) é montado no scaffold de
  cada cliente, não depois.

---

## 1. Decisão de arquitetura

### 1.1 O que fica

| Peça | Decisão | Motivo |
|---|---|---|
| **Servidor** `apps/server` (Node + Colyseus + TS) | **Fica como está** | É a fonte da verdade (CLAUDE.md §6). Colyseus resolve salas, matchmaking, reconexão e escala horizontal. Angular e Flutter viram só clientes de visualização. |
| **Lógica de jogo** `packages/games/*` (TS, `node:test`) | **Fica** | O `GamePlugin` roda no servidor. Os testes e hooks de TDD atuais continuam valendo sem mudança. |
| **Contrato** `packages/shared-types` | **Fica, renomeado para `packages/protocol`** | Continua sendo a fonte dos tipos no lado TS (servidor + Angular). O Flutter **não** importa daqui (é Dart) — espelha o contrato à mão a partir de `docs/contrato-wire.md`. |
| Redis / Postgres | Ficam | Estado efêmero de sala e dados persistentes. |

### 1.2 O que sai

| Peça | Ação |
|---|---|
| `apps/mobile-web` (Expo + React Native + react-native-web) | **Apagar.** As regras de negócio do ITO já estão em `packages/games/ito` (TS, servidor). As telas React servem só de referência visual — consultar via histórico do git antes de apagar (`git show HEAD:apps/mobile-web/src/games/ito/...`). |
| `packages/ui` (componentes React Native) | **Apagar.** Específico de RN. Angular e Flutter terão seus próprios kits de UI. |

### 1.3 O que entra

| Peça | Tecnologia |
|---|---|
| `apps/web` | **Angular** (standalone components, última LTS), TypeScript, SCSS. Cliente web. |
| `apps/mobile` | **Flutter** (Dart). Cliente iOS + Android. **Fora** do workspace npm/Turborepo (tem `pubspec.yaml` próprio). |
| `packages/protocol` | Tipos + nomes de eventos + validadores (zod) do protocolo WebSocket, no lado TS. |
| `docs/contrato-wire.md` | Documento vivo: todo evento, direção, formato de payload. Fonte da verdade para o cliente Dart. |

### 1.4 Diagrama de dependências (alvo)

```
                 ┌──────────────────────┐
                 │  apps/server (TS)    │  ← fonte da verdade
                 │  Colyseus + rooms    │
                 └──────────┬───────────┘
                            │ importa
         ┌──────────────────┼──────────────────┐
         │                  │                  │
 packages/protocol   packages/games/*    (Redis / Postgres)
   (tipos + zod)      (GamePlugin, TS)
         │
         │ importa (só lado TS)
         ▼
   apps/web (Angular) ────────WebSocket (JSON + schema)────────┐
                                                               │
   apps/mobile (Flutter) ──WebSocket (JSON + schema)───────────┤
     └─ espelha docs/contrato-wire.md à mão                     │
                                                               ▼
                                                        apps/server
```

---

## 2. Protocolo de comunicação (o ponto crítico)

O servidor hoje usa **duas formas** de mandar dados pro cliente:

1. **`@colyseus/schema`** (binário, sincronização automática de estado) — para o
   `LobbyState` (código da sala, fase, lista de jogadores, host).
2. **Mensagens JSON** via `client.send("evento", payload)` — para o estado do
   jogo (`game_state`, `game_over`, `start_game_error`).

O cliente JS/Angular decodifica schema de graça com `colyseus.js`. O cliente
Dart precisa de um decodificador de schema compatível.

### 2.1 Decisão: schema vs JSON para o estado do lobby

> **DECIDIDO — protocolo 100% JSON.** O servidor não expõe `@colyseus/schema`
> aos clientes. O `LobbyState` schema vira detalhe interno (ou é removido) e o
> servidor faz `broadcast("lobby_state", <JSON>)` a cada mudança relevante.

**Por quê:** o schema é um formato binário que exige um decoder da mesma versão
nos dois lados. `colyseus.js` traz o decoder pro Angular, mas o cliente Dart
dependeria de um pacote comunitário que pode não acompanhar o `@colyseus/schema`
**^3.0.0**. Um protocolo 100% JSON é idêntico pros dois clientes, versionável e
depurável (dá pra ver as mensagens no navegador).

**Custo aceito:** perde-se a sincronização incremental automática — o servidor
manda o estado inteiro do lobby a cada mudança. É barato: são < 12 jogadores.

**Transporte:** ainda dá pra usar o pacote `colyseus` do pub.dev **só para
conexão e matchmaking** (o handshake `joinOrCreate` + reconexão), consumindo
apenas mensagens JSON (`room.send` / `room.onMessage`) e nunca `room.state`.
Alternativa: `web_socket_channel` + replicar o handshake HTTP do Colyseus à mão
(documentado, simples). Decidir no scaffold do Flutter (Fase 3).

### 2.2 Eventos (estado atual do servidor — a formalizar em `docs/contrato-wire.md`)

**Entrada na sala:** `client.joinOrCreate("lobby", { code?, nickname })`
(sem `code` cria sala nova; com `code` entra na existente — `filterBy(["code"])`).

**Cliente → servidor:**

| Evento | Payload | Regra |
|---|---|---|
| `select_game` | `{ gameId: string, options?: unknown }` | Só o host. Só na fase `lobby`. Valida catálogo e nº de jogadores. |
| `toggle_ready` | `—` | Só na fase `starting`. Alterna o "pronto" do jogador. |
| `cancel_start` | `—` | Só o host. Volta pra `lobby`. |
| `game_action` | `unknown` (cada jogo define e valida) | Só na fase `playing`. Roteado pra `plugin.applyAction`. |

**Servidor → cliente:**

| Evento | Payload | Quando |
|---|---|---|
| `lobby_state` *(se Plano C)* | estado do lobby em JSON | A cada mudança. (Na Opção A isso é o schema.) |
| `game_state` | `plugin.getStateForPlayer(state, sessionId)` | A cada `game_action` aplicada; e ao entrar no meio de uma partida. Individual por jogador (esconde info). |
| `game_over` | `plugin.getResults(state)` | Quando `isGameOver` vira `true`. Sala volta pra `lobby`. |
| `start_game_error` | `{ message: string }` | Ação inválida (não é host, jogadores de menos, jogo inexistente, etc.). |

**Fases da sala:** `lobby` → `starting` (host propôs, aguarda todos "prontos") →
`playing` → volta pra `lobby` (maratona de jogos na mesma sala).

**Reconexão:** já implementada — `allowReconnection(client, 60)`. O cliente deve
guardar o `reconnectionToken` e tentar `client.reconnect(token)` ao cair.

### 2.3 `packages/protocol` (lado TS)

```
packages/protocol/src/
  game-plugin.ts     # (movido de shared-types) interface GamePlugin
  catalog.ts         # (movido) GAME_CATALOG
  events.ts          # NOVO: nomes de eventos como const, tipos de payload
  events.schema.ts   # NOVO: schemas zod para validar payloads de ENTRADA no servidor
  index.ts
```

- Nomes de evento em `snake_case` (CLAUDE.md §6), exportados como
  `export const EVENTS = { SELECT_GAME: "select_game", ... } as const`.
- O servidor valida **todo** payload de entrada com zod antes de usar (hoje ele
  confia no shape — melhorar durante a migração).
- Renomear o pacote: `@central-de-jogos/shared-types` →
  `@central-de-jogos/protocol` em todos os `package.json`, imports e tsconfig
  paths (`apps/server`, `packages/games/*`).

---

## 3. Estrutura alvo do monorepo

```
central-de-jogos/
├── apps/
│   ├── server/                 # inalterado (Node + Colyseus)
│   ├── web/                    # NOVO — Angular
│   └── mobile/                 # NOVO — Flutter (fora do workspace npm)
├── packages/
│   ├── protocol/               # ex-shared-types + eventos + zod
│   └── games/
│       ├── _template/
│       └── ito/
├── docs/
│   ├── PLANO_MIGRACAO_ANGULAR_FLUTTER.md   (este arquivo)
│   └── contrato-wire.md                     (NOVO)
├── .claude/                    # rules + hooks (pequenos ajustes de texto)
├── turbo.json                  # + tasks de web; mobile fora
├── package.json                # workspaces: apps/server, apps/web, packages/*
└── docker-compose.yml          # inalterado
```

- `package.json` raiz: `workspaces` passa a ser
  `["apps/server", "apps/web", "packages/*", "packages/games/*"]` — **`apps/mobile`
  não entra** (é Dart).
- `turbo.json`: `web` ganha `dev`/`build`/`lint`/`test`. Flutter roda por fora
  (`cd apps/mobile && flutter ...`); opcionalmente um script raiz
  `"mobile:test": "cd apps/mobile && flutter test"`.
- `.gitignore`: adicionar `apps/web/dist`, `.angular/`, `apps/mobile/build/`,
  `apps/mobile/.dart_tool/`, `apps/mobile/ios/Pods/`, `*.g.dart` só se optar por
  não versionar código gerado (decidir na Fase 4).

---

## 4. Angular — como estruturar (`apps/web`)

> "Bem estruturado, bem organizado" = arquitetura por features, standalone
> components, separação smart/dumb, estado em signals.

### 4.1 Setup

- `ng new web` dentro de `apps/`: standalone (sem NgModules), **SCSS**, routing,
  **sem SSR** de início (é uma UI de jogo, não conteúdo indexável — pode virar
  SSG depois se quiser landing page).
- Registrar como workspace npm: ajustar `apps/web/package.json` com scripts
  `dev` (`ng serve`), `build` (`ng build`), `lint` (`ng lint`), `test`.
- **Runner de teste:** o Karma foi descontinuado. Usar **Vitest** (builder
  `@angular/build:unit-test` com `vitest`, ou `@analogjs/vitest-angular`).
  Alinha com o `npm test` do monorepo.
- ESLint via `angular-eslint` (o resto do monorepo não tem eslint, mas Angular se
  beneficia muito — decisão: ligar só em `apps/web`).

### 4.2 Pastas

```
apps/web/src/app/
├── core/                       # singletons, carregados uma vez
│   ├── colyseus/
│   │   ├── colyseus.service.ts      # conexão bruta, joinOrCreate, reconnect
│   │   └── room.store.ts            # signals: sala, jogadores, fase, host, erros
│   ├── config/app-config.ts        # URL do servidor por ambiente
│   └── game-registry.ts            # id do catálogo -> () => import(componente)
├── shared/                     # burros, reutilizáveis
│   ├── ui/                          # botão, card, layout, avatar — SCSS + tokens
│   └── pipes/
├── features/
│   ├── home/                        # criar sala / entrar por código
│   ├── lobby/                       # lista de jogadores, escolher jogo (host)
│   ├── ready-check/                 # fase "starting"
│   ├── game-host/                   # container: troca o componente do jogo por id
│   └── games/
│       └── ito/                     # telas do ITO reconstruídas
│           ├── ito-clue/ ito-board/ ito-reveal/ ito-results/
│           └── ito.routes.ts
├── app.routes.ts
└── app.config.ts
```

### 4.3 Padrões

- **Estado:** `RoomStore` como serviço `providedIn: 'root'` expondo `signal`s
  (`players`, `phase`, `hostId`, `gameState`, `lastError`). O `ColyseusService`
  converte os eventos do socket num fluxo e atualiza os signals. Componentes só
  leem signals e disparam métodos do store. Sem NgRx (overkill para o tamanho);
  se quiser treinar NgRx SignalStore, dá pra trocar o `RoomStore` por ele sem
  mexer nos componentes.
- **Smart vs dumb:** componentes de `features/` são "smart" (injetam o store);
  os de `shared/ui/` são "dumb" (`input()`/`output()`, `ChangeDetectionStrategy.OnPush`,
  zero injeção de serviço).
- **Roteamento:** lazy por feature. `/` home · `/sala/:code` lobby ·
  `/sala/:code/jogar` game-host. O `game-host` lê `phase`/`activeGameId` do store
  e faz `import()` dinâmico do componente do jogo via `game-registry`.
- **Contrato de jogo no cliente:** interface
  `GameClientPlugin { id: string; loadComponent: () => Promise<Type<unknown>>; }`
  registrada num mapa — espelha o `registry.ts` do servidor. Adicionar jogo novo
  = uma linha aqui + a pasta em `features/games/`.
- **Estilo:** `styles/_tokens.scss` (cores, espaçamento, tipografia); componentes
  de UI consomem tokens. Considerar Angular CDK (overlay, a11y) sem Angular
  Material, pra treinar CSS de verdade.
- **Ambiente:** `app-config.ts` lê a URL do servidor de
  `import.meta.env`/`environment.ts` (`ws://localhost:2567` em dev).

### 4.4 Testes (Angular)

- Lógica pura (mapeadores de estado do jogo pra view, validações de formulário)
  primeiro, com Vitest.
- Componentes: `@testing-library/angular` + asserção de comportamento visível.
- `RoomStore`: testar com um `ColyseusService` fake (Mock Object — ver
  `.claude/rules/tdd.md`).

---

## 5. Flutter — como estruturar (`apps/mobile`)

### 5.1 Setup

- `flutter create --org com.centraldejogos --platforms=ios,android mobile` dentro
  de `apps/`.
- Dependências principais:
  - **Transporte** (ver §2.1): pacote `colyseus` do pub.dev usado **só para
    conexão/matchmaking/reconexão**, consumindo mensagens JSON e nunca
    `room.state`; ou `web_socket_channel` + handshake HTTP à mão. Decidir no
    scaffold.
  - **`flutter_riverpod`** — estado (testável, sem boilerplate de Bloc; bom pra
    treino). Alternativa: `flutter_bloc` se quiser treinar Bloc.
  - **`go_router`** — navegação declarativa.
  - **`freezed` + `json_serializable` + `build_runner`** — modelos imutáveis do
    protocolo a partir do JSON.
- Lints: `flutter_lints` (padrão) — considerar `very_good_analysis`.

### 5.2 Pastas

```
apps/mobile/lib/
├── main.dart
├── app.dart                    # MaterialApp.router + tema
├── core/
│   ├── colyseus/
│   │   ├── colyseus_client.dart     # wrapper: connect, joinOrCreate, reconnect
│   │   └── room_controller.dart     # Riverpod Notifier: estado da sala
│   ├── config/app_config.dart       # URL do servidor por ambiente (--dart-define)
│   └── game_registry.dart           # id do catálogo -> WidgetBuilder
├── models/                     # espelho de docs/contrato-wire.md (freezed)
│   ├── lobby_state.dart  player.dart  game_results.dart
│   └── events.dart                  # nomes de eventos (const)
├── shared/
│   └── widgets/                     # botão, card, layout — widgets pequenos
├── features/
│   ├── home/  lobby/  ready_check/  game_host/
│   └── games/
│       └── ito/
│           └── ito_clue_screen.dart  ito_board_screen.dart  ...
└── routing/app_router.dart
```

### 5.3 Padrões

- **Estado:** um `RoomController` (Riverpod `Notifier`/`AsyncNotifier`) que
  assina os eventos do `ColyseusClient` e expõe um `RoomState` imutável. Widgets
  fazem `ref.watch`. Ações da UI chamam métodos do controller.
- **Separar lógica de UI:** nada de regra no `build()`. Mapeadores
  estado→viewmodel ficam em funções puras testáveis em `models/` ou em
  `*_view_model.dart`.
- **Widgets pequenos** (`.claude/rules/clean-code.md` §2/§9 aplicado a Flutter):
  um widget = uma responsabilidade; extrair `Widget` privado em vez de método
  `_buildX()`.
- **Contrato de jogo no cliente:** `typedef GameBuilder = Widget Function(GameContext ctx);`
  num `Map<String, GameBuilder>`. Espelha o registry do servidor.
- **Ambiente:** `--dart-define=SERVER_URL=ws://10.0.2.2:2567` (emulador Android
  aponta pro host via `10.0.2.2`).
- **Modelos do protocolo:** gerados de JSON com `freezed`/`json_serializable`.
  Como Dart não compartilha tipo com o TS, **`docs/contrato-wire.md` é a fonte** —
  qualquer mudança no protocolo atualiza o doc e os dois lados.

### 5.4 Testes (Flutter)

- `flutter test`: testes de unidade dos mapeadores puros e do `RoomController`
  (com um `ColyseusClient` fake).
- Widget tests das telas principais (lobby, ITO).

---

## 6. Mudanças no servidor (`apps/server`)

Pequenas, mas necessárias:

1. **Renomear import** `@central-de-jogos/shared-types` → `@central-de-jogos/protocol`.
2. **Validar payloads de entrada com zod** (`select_game`, `game_action`, opções
   de join) — hoje confia no shape recebido.
3. **CORS / origens permitidas:** liberar `http://localhost:4200` (Angular dev) e
   o app Flutter. Adicionar `ALLOWED_ORIGINS` ao `.env.example`.
4. **Protocolo JSON** (§2.1, decidido): adicionar
   `broadcast("lobby_state", toJSON(this.state))` nos pontos de mudança e tratar
   o `LobbyState` schema como interno (ou removê-lo).
5. **`game_over` → também mandar `lobby_state`** atualizado (a sala volta pra
   `lobby`) — hoje o cliente descobre pela mudança de `phase` no schema; com JSON
   precisa ser explícito.
6. **Teste de integração de sala:** adotar `@colyseus/testing` para um teste
   ponta-a-ponta do fluxo lobby→starting→playing→game_over.
7. `.env.example`: revisar chaves (Postgres, Redis, PORT, ALLOWED_ORIGINS).

> Nenhuma dessas mexe em `packages/games/*` — a lógica de jogo e seus testes
> ficam intactos. Os hooks de TDD (`.claude/hooks`) continuam válidos sem
> alteração (eles só olham `packages/games/*/src`).

---

## 7. Ajustes em `.claude/` (rules e hooks)

Só texto — o enforcement não muda de comportamento.

| Arquivo | Mudança |
|---|---|
| `.claude/rules/clean-code.md` | Trocar menções a React Native/Expo por Angular + Flutter. Adicionar "aplicação": Angular (standalone, smart/dumb, signals, OnPush) e Flutter (widgets pequenos, lógica fora do `build`, providers testáveis). |
| `.claude/rules/tdd.md` | Seção "Aplicação neste repo": 3 runners — `node:test` (servidor/games), Vitest (`apps/web`), `flutter test` (`apps/mobile`). TDD **obrigatório e com hook** só em `packages/games/*`; nas camadas de cliente é recomendado, não bloqueado. |
| `.claude/rules/gitflow.md` | Escopos de commit: trocar `mobile-web` por `web`, adicionar `mobile` e `ci`. Checks antes de subir: `npm run lint && npm test` **e** `cd apps/mobile && flutter analyze && flutter test`. Nota: agora há CI no GitHub Actions rodando isso a cada push/PR (deixou de ser "se você não rodar, ninguém roda"). |
| `.claude/rules/fluxo-de-trabalho.md` | Lista de peças do monorepo: `apps/server`, `apps/web`, `apps/mobile`, `packages/protocol`, `packages/games/*`. |
| `.claude/hooks/*` | **Sem mudança.** `classify()` já mira só `packages/games/*/src`. |
| `.claude/settings.json` | Sem mudança. |

Opcional (decidir depois): estender `post-edit-verify.js` para rodar
`ng lint`/`flutter analyze` no arquivo tocado. Fora do escopo inicial — o projeto
é pequeno.

---

## 8. Reescrita do `CLAUDE.md`

Seções a reescrever:

- **§2 Stack tecnológica** — nova tabela:
  | Camada | Escolha |
  |---|---|
  | Web | Angular (standalone, SCSS), TypeScript |
  | Mobile (iOS/Android) | Flutter (Dart) |
  | Servidor / real-time | Node.js + Colyseus (TS) — **inalterado** |
  | Contrato cliente↔servidor | `packages/protocol` (TS) + `docs/contrato-wire.md` (fonte p/ o Dart) |
  | Estado efêmero | Redis · Persistência | PostgreSQL |
  | Monorepo | Turborepo (partes JS) + Flutter por fora |
- **§3 Estrutura** — nova árvore (§3 deste plano).
- **§4 Arquitetura de jogo plugável** — manter o `GamePlugin` do servidor
  **verbatim**; **adicionar**: o contrato de jogo **no cliente** (registry
  Angular + registry Flutter) e o **protocolo WebSocket** (apontar pra
  `docs/contrato-wire.md`).
- **§5 Fluxo de sala** — manter; explicitar os eventos JSON.
- **§6 Convenções** — adicionar bloco Angular e bloco Dart/Flutter; manter
  `snake_case` nos eventos e "servidor é a fonte da verdade".
- **§7 Build e deploy** — nova tabela (§10 deste plano).
- **§8 Roadmap** — substituir pelo §9 deste plano.
- **Checklist "adicionar um jogo novo"** — passa a ter 4 lugares: (1) plugin TS +
  testes em `packages/games/`, (2) entrada no catálogo `packages/protocol`,
  (3) componente Angular em `apps/web/.../games/`, (4) widget Flutter em
  `apps/mobile/.../games/`.

---

## 9. Roadmap de execução (fases)

Cada fase é uma ou mais branches `tipo/descricao` a partir de `dev`, com
`npm test` + `npm run lint` verdes antes do merge (`.claude/rules/gitflow.md`).

### Fase 0 — Limpeza, contrato e CI
1. `chore/remove-clientes-react`: apagar `apps/mobile-web` e `packages/ui`;
   ajustar `package.json` raiz, `turbo.json`, `.gitignore`. Servidor tem que
   continuar buildando e `npm test` verde.
2. `refactor/renomeia-protocol`: `packages/shared-types` → `packages/protocol`;
   atualizar imports em `apps/server` e `packages/games/*`.
3. `feat/protocol-eventos`: `events.ts` (nomes) + `events.schema.ts` (zod) +
   testes. Servidor valida entradas com zod.
4. Escrever `docs/contrato-wire.md` (primeira versão completa) — Markdown: uma
   tabela por evento (nome, direção, quando dispara) + bloco de JSON de exemplo +
   notas de reconexão e erro.
5. `ci/github-actions`: workflow que roda `npm run lint` + `npm test` a cada
   push/PR pra `dev`. (O passo de `flutter test` entra quando `apps/mobile`
   existir, na Fase 3.)

### Fase 1 — Servidor pronto para dois clientes
6. `feat/server-cors-json`: CORS/origens permitidas; protocolo JSON (§2.1) —
   `broadcast("lobby_state", <JSON>)` nos pontos de mudança; `LobbyState` schema
   vira interno ou é removido; `game_over` passa a mandar `lobby_state` também.
7. `test/server-fluxo-sala`: teste de integração com `@colyseus/testing`
   (lobby → starting → playing → game_over).
8. Fechar `docs/contrato-wire.md` com o protocolo final.

### Fase 2 — Web (Angular) MVP
9. `feat/web-scaffold`: `ng new`, workspace npm, Vitest, `angular-eslint`,
   estrutura de pastas. **Design system:** o usuário fornece uma referência
   visual e o `_tokens.scss` + componentes-base (botão, card, layout, input)
   são montados aqui. Página vazia compilando + CI passando.
10. `feat/web-colyseus-core`: `ColyseusService` + `RoomStore` (signals) + testes
    com fake.
11. `feat/web-lobby`: home (criar/entrar), lobby (lista de jogadores, escolher
    jogo — host), ready-check.
12. `feat/web-game-host`: container que troca o componente por `activeGameId`;
    registry no cliente; template game funcionando ponta a ponta.
13. `feat/web-ito`: telas do ITO (clue / board / reveal / results).
14. `chore/web-deploy`: build estático na Vercel.

### Fase 3 — Mobile (Flutter) MVP
15. `feat/mobile-scaffold`: `flutter create --platforms=ios,android`, deps
    (riverpod, go_router, freezed), estrutura, `ThemeData` + widgets-base a
    partir da mesma referência visual da web, `flutter analyze`/`test` verdes.
    Adicionar `flutter test` ao workflow de CI. **Testes e execução só em
    Android** (emulador/aparelho) — iOS fica compatível no código mas sem build.
16. `feat/mobile-colyseus-core`: transporte (§2.1) + `RoomController` + modelos
    freezed do contrato + testes com fake.
17. `feat/mobile-lobby`: home, lobby, ready-check.
18. `feat/mobile-game-host`: registry + template game ponta a ponta.
19. `feat/mobile-ito`: telas do ITO.
20. Build Android: `flutter build apk` local, sob demanda. Sem pipeline
    automatizado por enquanto (nem Android nem iOS).

### Fase 4 — Paridade, escala e deploy
21. Revisar paridade de features entre web e mobile (lobby + template + ITO).
22. `test/multi-sala`: várias salas simultâneas, ajustar driver Redis do Colyseus.
23. **Decidir a hospedagem do servidor** (Fly.io / Render / VPS — ver §11) e subir
    um ambiente: servidor + Redis + Postgres gerenciados, web na Vercel.
24. `docs/atualiza-claude-md`: reescrever `CLAUDE.md` conforme §8 e marcar o
    roadmap.

### Fase 5 — Novos jogos (contínuo)
25. Por jogo: plugin TS + testes → catálogo → componente Angular → widget
    Flutter. Documentar o ciclo no `CLAUDE.md`.

---

## 10. Build e deploy (alvo)

| Peça | Local | Produção |
|---|---|---|
| `apps/server` | `docker compose up` (server + Postgres + Redis) | Builda o `Dockerfile` (inalterado). **Host a decidir na Fase 4** — Fly.io / Render / VPS. Railway funciona mas o grátis é limitado. |
| `apps/web` (Angular) | `ng serve` (porta 4200) | `ng build` → estático → **Vercel** (grátis, sem Docker) |
| `apps/mobile` (Flutter) | `flutter run` em **Android** (emulador/aparelho) | `flutter build apk` local, sob demanda. Publicação (Play Store / iOS) **adiada** — iOS exige macOS/Xcode. |

- **Docker continua só para o servidor.**
- **Nunca containerizar `apps/web` nem `apps/mobile`.**
- Variáveis sensíveis em `.env` (nunca commitado) + `.env.example` documentando
  as chaves. Cliente: URL do servidor via `environment.ts` (Angular) e
  `--dart-define` (Flutter).

---

## 11. O que ainda está em aberto

As decisões de tecnologia estão fechadas (§0). Resta:

| # | Assunto | Situação |
|---|---|---|
| A | **Hospedagem do servidor** | Decidir na **Fase 4**. Precisa de processo sempre ligado + Redis + Postgres. Candidatos: **Fly.io** (cota grátis, mais mão na massa), **Render** (grátis hiberna após 15 min — ruim p/ tempo real; pago ~US$7), **Railway** (US$5 de crédito/mês, some rápido), **VPS** ~US$5/mês (Hetzner). O `Dockerfile` não muda — escolher depois não gera retrabalho. |
| B | **Identidade visual** | O usuário fornece uma referência (print/site/paleta/fonte) **no início da Fase 2**. A partir dela: `_tokens.scss` + componentes-base no Angular, `ThemeData` + widgets-base no Flutter (mesma linguagem visual nos dois). ~meio dia por cliente. |
| C | **Transporte do cliente Dart** | Pacote `colyseus` (só conexão/matchmaking, sem schema) vs `web_socket_channel` + handshake à mão. Decidir no scaffold do Flutter (Fase 3, item 16). Baixo risco — protocolo já é JSON. |
| D | **Formato exato dos payloads** | Não é decisão, é trabalho: escrever `docs/contrato-wire.md` na Fase 0 (item 4) e fechar na Fase 1 (item 8). |

Itens historicamente "a definir" no `CLAUDE.md` que **seguem em aberto e não
bloqueiam** a migração: autenticação (§8 do plano), limite de jogadores por sala,
existência de uma "tela mestre"/TV.

---

## 12. Progresso

- [x] **Fase 0 — Limpeza, contrato e CI** — clientes React removidos;
  `shared-types` → `protocol` com `events.ts` + schemas zod; `docs/contrato-wire.md`;
  workflow de CI (`.github/workflows/ci.yml`).
- [x] **Fase 1 — Servidor pronto p/ dois clientes** — `LobbyRoom` sem
  `@colyseus/schema`, estado via evento JSON `lobby_state`; CORS +
  `ALLOWED_ORIGINS`; teste de integração `apps/server/src/rooms/LobbyRoom.test.ts`
  (fluxo completo + recusas). Pendência menor: teste dedicado de reconexão com
  fake timers (o `allowReconnection` de 60 s seguraria o processo).
- [~] **Fase 2 — Web (Angular) MVP** — em andamento:
  - [x] Referência visual definida (base: projeto `organo`) e preview aprovado
    (`docs/preview-visual.html`).
  - [x] `feat/web-scaffold` — Angular 20 em `apps/web`, workspace npm, Vitest
    (`@angular/build:unit-test`), Node 22 no CI/Dockerfile.
  - [x] `feat/web-design-system` — `styles/_tokens.scss` + `_mixins.scss` +
    `shared/ui` (Button, Card, RoomCode, Badge, PlayerChip, TextField, Screen,
    `burstConfetti`).
  - [x] `feat/web-colyseus-core` — `ColyseusService` + `RoomStore` (signals) +
    testes com fake. **Protocolo validado ponta a ponta com `colyseus.js` real
    contra o servidor** (criar → entrar → select → ready → jogar → game_over).
  - [x] `feat/web-lobby` — home (criar/entrar), `/sala` (guard + fase), lobby
    com catálogo, ready-check. Catálogo ganhou `icon`/`accent`/`tagline` por jogo.
    zod saiu de `packages/protocol` → `apps/server/protocol-validation.ts`.
  - [x] `fix/web-protocol-import` — `apps/web` importa `@central-de-jogos/protocol`
    pelo **código-fonte** (`tsconfig` paths → `packages/protocol/src/index.ts`),
    porque o dev server do Angular não lê exports nomeados do `dist` CJS. Regra
    p/ dependências futuras de `packages/*` no web: mesma coisa.
  - [x] **`feat/web-game-host`**. Container que troca o componente do jogo por
    `activeGameId` via `core/colyseus/game-registry.ts` (mapa `id → () =>
    import(componente)`, espelha `apps/server/src/games/registry.ts`) +
    `game-host.ts` carrega dinamicamente com `NgComponentOutlet` + tela de
    resultados com `store.results()` e `burstConfetti` + componente `_template`
    (contador) funcionando ponta a ponta (lint + testes verdes).
  - [ ] **`feat/web-ito`** ← RETOMAR AQUI. Telas do ITO em `features/games/ito/`.
    Reler `packages/games/ito/src/types.ts` (`ItoStateForPlayer`, `ItoAction`,
    `ItoPhase`) e transformar cada regra num item de checklist. Registry já suporta
    import dinâmico — só adicionar a linha comentada em `game-registry.ts`.
  - [ ] `chore/web-deploy` — Vercel (root `apps/web`, build `ng build`, output
    `apps/web/dist/web/browser`).
- [ ] Fase 3 — Mobile (Flutter) MVP
- [ ] Fase 4 — Paridade, escala e deploy
- [ ] Fase 5 — Novos jogos (contínuo)
