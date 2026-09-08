/**
 * Contrato do protocolo WebSocket entre a Central (servidor Colyseus) e os
 * clientes (Angular, Flutter). Nomes de evento em `snake_case` (CLAUDE.md §6).
 *
 * O lado TS (servidor + Angular) importa daqui. O cliente Flutter (Dart) não
 * importa — espelha `docs/contrato-wire.md`, que descreve os mesmos formatos.
 *
 * Regra: nenhuma mudança neste arquivo entra sozinha — servidor, Angular e
 * Flutter mudam na mesma leva, com commit `feat(protocol)!:` / `BREAKING CHANGE:`.
 */

/** Eventos que o cliente envia para o servidor. */
export const CLIENT_EVENTS = {
  SELECT_GAME: "select_game",
  TOGGLE_READY: "toggle_ready",
  CANCEL_START: "cancel_start",
  GAME_ACTION: "game_action",
} as const;

/** Eventos que o servidor envia para o cliente. */
export const SERVER_EVENTS = {
  LOBBY_STATE: "lobby_state",
  GAME_STATE: "game_state",
  GAME_OVER: "game_over",
  START_GAME_ERROR: "start_game_error",
} as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

/**
 * Fases da sala — controlam qual tela o cliente mostra.
 * `starting`: o host propôs um jogo e a sala espera todo mundo confirmar
 * "pronto" antes de instanciar o `GamePlugin`.
 */
export const ROOM_PHASES = ["lobby", "starting", "playing"] as const;
export type RoomPhase = (typeof ROOM_PHASES)[number];

// ---------------------------------------------------------------------------
// Payloads: cliente -> servidor
// ---------------------------------------------------------------------------

/** Opções passadas em `client.joinOrCreate("lobby", options)`. */
export interface JoinOptions {
  /** Apelido temporário. Vazio/ausente → o servidor gera um. */
  nickname?: string;
  /** Código da sala a entrar. Ausente → cria sala nova. */
  code?: string;
}

export interface SelectGamePayload {
  gameId: string;
  /** Configuração do jogo escolhida pelo host. Opaca aqui — cada `GamePlugin` valida a sua. */
  options?: unknown;
}

// `toggle_ready` e `cancel_start` não têm payload.
// `game_action`: payload opaco — o `GamePlugin.applyAction` do jogo ativo valida.

// ---------------------------------------------------------------------------
// Payloads: servidor -> cliente
// ---------------------------------------------------------------------------

export interface LobbyPlayerView {
  id: string;
  nickname: string;
  /** false enquanto o jogador está no período de tolerância a desconexão. */
  connected: boolean;
  /** true quando confirmou "pronto" durante a fase `starting`. */
  ready: boolean;
}

/** Estado da sala, mandado inteiro a cada mudança (evento `lobby_state`). */
export interface LobbyStatePayload {
  code: string;
  phase: RoomPhase;
  /** sessionId de quem criou a sala — só ele escolhe/inicia um jogo. */
  hostId: string;
  /** Id do jogo em andamento; vazio fora da fase `playing`. */
  activeGameId: string;
  /** Id do jogo proposto, aguardando confirmação; só durante `starting`. */
  pendingGameId: string;
  players: LobbyPlayerView[];
}

export interface StartGameErrorPayload {
  message: string;
}

// `game_state`: payload é o retorno de `GamePlugin.getStateForPlayer` (opaco).
// `game_over`: payload é `GameResults` (ver game-plugin.ts).
