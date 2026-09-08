# Contrato WebSocket — Central de Jogos

> **Fonte da verdade do protocolo entre o servidor Colyseus e os clientes.**
>
> - O lado TS (servidor + Angular) importa os tipos e nomes de
>   `@central-de-jogos/protocol` (`packages/protocol/src/events.ts`).
> - O cliente **Flutter (Dart)** não importa nada — **espelha este documento à
>   mão** (modelos `freezed`).
> - **Regra:** qualquer mudança aqui mexe em servidor + Angular + Flutter na
>   mesma leva, com commit `feat(protocol)!:` / `BREAKING CHANGE:`.
>
> **Status:** fechado na Fase 1. O protocolo é 100% JSON — o servidor não usa
> mais `@colyseus/schema` para falar com os clientes. Coberto pelo teste de
> integração `apps/server/src/rooms/LobbyRoom.test.ts`.

---

## 1. Conexão e matchmaking

O transporte é WebSocket via Colyseus. Só existe um tipo de sala: **`lobby`**.

```
client.joinOrCreate("lobby", { nickname?, code? })
```

| Situação | O que acontece |
|---|---|
| Sem `code` | Cria uma sala nova. O servidor gera um código de 4 letras (alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ` — sem I/O/0/1) e devolve no estado. Quem cria vira **host**. |
| Com `code` | Entra na sala existente com aquele código (`filterBy(["code"])`). Erro se não existe / está cheia (`maxClients = 12`). |

`nickname`: apelido temporário, 1–20 caracteres úteis. Vazio ou ausente → o
servidor gera `Jogador<n>`. Campos extras nas opções são ignorados.

Sem contas por enquanto — cada `sessionId` do Colyseus é a identidade do jogador
durante a vida da sala.

## 2. Reconexão

O servidor segura a vaga por **60 segundos** após uma queda não intencional
(`allowReconnection`). O cliente deve:

1. Guardar o `reconnectionToken` que o Colyseus expõe após o join.
2. Ao detectar queda, tentar `client.reconnect(reconnectionToken)` dentro da
   janela de 60 s.
3. Se falhar (janela expirou), voltar à tela inicial e entrar de novo pelo
   código.

Enquanto um jogador está no período de tolerância, ele aparece na lista com
`connected: false`. Saída intencional (fechar o app, botão “sair”) remove na
hora.

## 3. Fases da sala

```
lobby  ──select_game(host)──▶  starting  ──todos toggle_ready──▶  playing
  ▲                                │                                  │
  └────────────── cancel_start / game_over / jogadores insuficientes ──┘
```

| Fase | Significado | Tela do cliente |
|---|---|---|
| `lobby` | Aguardando. O host pode escolher um jogo. | Lista de jogadores + catálogo (só o host escolhe). |
| `starting` | Host propôs um jogo; a sala espera todo mundo confirmar “pronto”. | Ready-check. |
| `playing` | Jogo em andamento. | Tela do jogo ativo. |

Maratona: ao terminar um jogo a sala volta para `lobby`, pronta para o próximo.

---

## 4. Eventos — cliente → servidor

### `select_game`
Propor um jogo. **Só o host, só na fase `lobby`.**

```json
{ "gameId": "ito", "options": { "modo": "consensus", "rodadas": 3 } }
```

- `gameId` (string, obrigatório): id do catálogo (`packages/protocol/src/catalog.ts`).
- `options` (opaco, opcional): configuração do jogo. O servidor **não** inspeciona
  — repassa para `GamePlugin.createInitialState`, que valida/normaliza.
- Validação de estrutura: `selectGamePayloadSchema` (zod). Payload inválido →
  `start_game_error`.
- Regras de negócio que também podem recusar: não é host, fase errada, jogo fora
  do catálogo, número de jogadores fora de `minPlayers..maxPlayers`.

### `set_game_options`
Ajustar a configuração do jogo proposto. **Só o host, só na fase `starting`.**

```json
{ "options": { "mode": "individual", "rounds": { "type": "fixed", "totalRounds": 3 } } }
```

- `options` (opaco): mesmo formato que `select_game.options` — o jogo valida em
  `createInitialState`. Validação de estrutura: `setGameOptionsPayloadSchema`.
- O servidor guarda em `pendingGameOptions` e **reseta todos os “prontos”** (pra
  ninguém entrar num modo que não escolheu), rebroadcasta `lobby_state`.
- Usado pela tela de config pré-jogo (ex: modo/rodadas do ITO na tela de “pronto”).

### `toggle_ready`
Alternar o próprio “pronto”. **Só na fase `starting`.** Sem payload.

Quando **todos** os jogadores conectados estão `ready`, o servidor instancia o
`GamePlugin` e a sala vai para `playing`.

### `cancel_start`
Cancelar a proposta e voltar para `lobby`. **Só o host, só na fase `starting`.**
Sem payload.

### `game_action`
Uma jogada. **Só na fase `playing`.** Payload **específico do jogo ativo** —
opaco para a Central. O servidor repassa para
`GamePlugin.applyAction(state, sessionId, action)`; o jogo valida e ignora ações
inválidas (retorna o estado inalterado).

```json
{ "type": "submit_clue", "clue": "meia-noite" }
```

O formato de cada jogo fica documentado no `packages/games/<jogo>` e (para o
cliente) em `apps/*/**/games/<jogo>`.

---

## 5. Eventos — servidor → cliente

### `lobby_state`
Estado completo da sala, reenviado **inteiro a cada mudança** (entrou/saiu
jogador, mudou fase, mudou host, alguém ficou pronto).

```json
{
  "code": "ABCD",
  "phase": "starting",
  "hostId": "aBc123",
  "activeGameId": "",
  "pendingGameId": "ito",
  "pendingGameOptions": { "mode": "consensus", "rounds": { "type": "fixed", "totalRounds": 5 } },
  "players": [
    { "id": "aBc123", "nickname": "Ana",  "connected": true,  "ready": true },
    { "id": "xYz789", "nickname": "Beto", "connected": false, "ready": false }
  ]
}
```

Tipo: `LobbyStatePayload` em `packages/protocol/src/events.ts`. O servidor emite
este evento no `onJoin`, `onLeave`, e a cada transição de fase / mudança de host
/ toggle de "pronto".

### `game_state`
Estado do jogo **na visão de um jogador específico** — pode esconder informação
dos outros. Enviado individualmente (`client.send`) após cada `game_action`
aplicada, e ao entrar no meio de uma partida.

Payload = retorno de `GamePlugin.getStateForPlayer(state, sessionId)`. Formato
definido por cada jogo (ex.: `ItoStateForPlayer` em `packages/games/ito`).

### `game_over`
O jogo terminou (`GamePlugin.isGameOver` virou `true`). A sala volta para
`lobby`.

Payload = `GamePlugin.getResults(state)` — um objeto (`GameResults`), formato
definido por cada jogo. Exemplo genérico:

```json
{ "ranking": ["aBc123", "xYz789"], "acertou": true }
```

Após `game_over`, o servidor também emite um `lobby_state` com `phase: "lobby"`
e `activeGameId: ""`.

### `start_game_error`
Uma ação foi recusada. O cliente mostra a mensagem e permanece na tela atual.

```json
{ "message": "ITO precisa de 3 a 8 jogadores (tem 2)." }
```

Tipo: `StartGameErrorPayload`. Usado tanto para recusas de `select_game` quanto
para `game_action` fora de hora.

---

## 6. Resumo rápido

| Evento | Direção | Fase | Payload |
|---|---|---|---|
| `select_game` | C→S | lobby | `{ gameId, options? }` |
| `set_game_options` | C→S | starting (host) | `{ options }` |
| `toggle_ready` | C→S | starting | — |
| `cancel_start` | C→S | starting | — |
| `game_action` | C→S | playing | opaco (do jogo) |
| `lobby_state` | S→C | qualquer | `LobbyStatePayload` |
| `game_state` | S→C | playing | opaco (do jogo, por jogador) |
| `game_over` | S→C | fim de partida | `GameResults` (do jogo) |
| `start_game_error` | S→C | qualquer | `{ message }` |
