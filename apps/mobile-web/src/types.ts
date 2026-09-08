export interface LobbyPlayer {
  id: string;
  nickname: string;
  connected: boolean;
  ready: boolean;
}

/** Espelha `TemplateGameStateForPlayer` de packages/games/_template. */
export interface TemplateGameState {
  myCount: number;
  target: number;
  counters: Record<string, number>;
}

/** Espelha o retorno de `getResults` do jogo _template. */
export interface TemplateGameResults {
  target: number;
  counters: Record<string, number>;
}
