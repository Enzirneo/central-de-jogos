/**
 * Espelho manual do contrato do ITO — copiado de
 * `packages/games/ito/src/types.ts` (a parte que o cliente enxerga).
 *
 * É de propósito que NÃO importamos de `@central-de-jogos/game-ito`: aquele é um
 * pacote Node com código de runtime; o cliente só precisa das formas. O app
 * Flutter faz o mesmo espelhamento. Se o contrato mudar lá, atualizar aqui.
 */

export type ItoMode = 'consensus' | 'individual';

export type ItoRoundsConfig =
  | { type: 'fixed'; totalRounds: number }
  | { type: 'endless' };

/** Opções que o host escolhe antes de começar (evento `set_game_options`). */
export interface ItoStartOptions {
  mode: ItoMode;
  rounds: ItoRoundsConfig;
}

export type ItoPhase = 'giving_clues' | 'organizing' | 'revealed';

export interface ItoCardInfo {
  playerId: string;
  hasSubmittedClue: boolean;
  /** null enquanto escondida (dica de outro na fase giving_clues). */
  clue: string | null;
  /** null até a fase revealed. */
  number: number | null;
}

export interface ItoRoundResult {
  correctOrder: string[];
  finalBoard?: string[];
  correctPositions?: number;
  winners?: string[];
}

/** O que o servidor envia pra cada jogador (evento `game_state`). */
export interface ItoStateForPlayer {
  mode: ItoMode;
  roundsConfig: ItoRoundsConfig;
  theme: string;
  phase: ItoPhase;
  round: number;
  cards: Record<string, ItoCardInfo>;
  lastRoundResult: ItoRoundResult | null;
  myNumber: number;
  /** consensus: quadro compartilhado. individual: palpite privado deste jogador. */
  board: string[];
  readyToReveal: string[];
  readyForNextRound: string[];
  teamScore?: number;
  individualWins?: Record<string, number>;
}

export type ItoAction =
  | { type: 'submit_clue'; clue: string }
  | { type: 'reorder_board'; order: string[] }
  | { type: 'ready_to_reveal' }
  | { type: 'ready_for_next_round' }
  | { type: 'end_game' };
