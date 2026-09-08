export type PlayerId = string;

export interface GameResults {
  [key: string]: unknown;
}

export interface GamePlugin<TState = unknown, TAction = unknown, TOptions = unknown> {
  /** Identificador único do jogo, usado no catálogo */
  id: string;

  /** Nome exibido ao usuário */
  displayName: string;

  /** Mínimo e máximo de jogadores suportados */
  minPlayers: number;
  maxPlayers: number;

  /**
   * Cria o estado inicial do jogo quando a sala decide iniciá-lo.
   * `options` carrega configurações escolhidas pelo host antes de começar
   * (ex: modo de jogo, número de rodadas) — cada jogo define seu próprio
   * formato e deve validar/normalizar o que recebe, já que chega direto do
   * cliente sem passar pela Central. Opcional: jogos sem configuração podem
   * ignorar o parâmetro.
   */
  createInitialState(players: PlayerId[], options?: TOptions): TState;

  /** Processa uma ação de um jogador e retorna o novo estado */
  applyAction(state: TState, playerId: PlayerId, action: TAction): TState;

  /** Indica se o jogo terminou, dado o estado atual */
  isGameOver(state: TState): boolean;

  /** Retorna o placar final quando o jogo termina */
  getResults(state: TState): GameResults;

  /** Estado que deve ser enviado a um jogador específico (permite esconder info, ex: cartas de outros) */
  getStateForPlayer(state: TState, playerId: PlayerId): unknown;
}
