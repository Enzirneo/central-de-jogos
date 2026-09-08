import type { PlayerId } from "@central-de-jogos/shared-types";

export type ItoMode = "consensus" | "individual";

export type ItoRoundsConfig =
  | { type: "fixed"; totalRounds: number }
  | { type: "endless" };

export interface ItoStartOptions {
  mode: ItoMode;
  rounds: ItoRoundsConfig;
}

export type ItoPhase = "giving_clues" | "organizing" | "revealed";

export interface ItoRoundPlayerData {
  secretNumber: number;
  clue: string | null;
}

export interface ItoRoundResult {
  correctOrder: PlayerId[];
  /** Só preenchido no modo "consensus". */
  finalBoard?: PlayerId[];
  correctPositions?: number;
  /** Só preenchido no modo "individual" — jogadores que acertaram 100% da ordem. */
  winners?: PlayerId[];
}

/** Estado interno completo — nunca é enviado direto pro cliente (ver getStateForPlayer). */
export interface ItoState {
  mode: ItoMode;
  roundsConfig: ItoRoundsConfig;
  players: PlayerId[];

  theme: string;
  phase: ItoPhase;
  round: number;
  roundData: Record<PlayerId, ItoRoundPlayerData>;

  /** Modo "consensus": um quadro só, compartilhado por todos. */
  sharedBoard: PlayerId[];

  /** Modo "individual": o palpite privado de cada jogador. */
  individualBoards: Record<PlayerId, PlayerId[]>;

  /** Placar de equipe (soma de posições certas por rodada) — só no modo "consensus". */
  teamScore: number;

  /** Rodadas vencidas (acerto de 100%) por jogador — só no modo "individual". */
  individualWins: Record<PlayerId, number>;

  /** true quando alguém encerrou manualmente uma partida em modo "endless". */
  endedManually: boolean;

  lastRoundResult: ItoRoundResult | null;

  /**
   * Jogadores que confirmaram estar prontos pra revelar (fase "organizing").
   * Só revela quando esse array tem todo mundo — ninguém revela sozinho.
   */
  readyToReveal: PlayerId[];

  /** Jogadores que confirmaram estar prontos pra próxima rodada (fase "revealed"). */
  readyForNextRound: PlayerId[];
}

export type ItoAction =
  | { type: "submit_clue"; clue: string }
  | { type: "reorder_board"; order: PlayerId[] }
  | { type: "ready_to_reveal" }
  | { type: "ready_for_next_round" }
  | { type: "end_game" };

export interface ItoCardInfo {
  playerId: PlayerId;
  hasSubmittedClue: boolean;
  /** null enquanto escondida (dica de outro jogador na fase "giving_clues"). */
  clue: string | null;
  /** null até a fase "revealed" — nunca preenchido antes disso. */
  number: number | null;
}

/** Formato enviado pra cada jogador — é aqui que a visibilidade é garantida. */
export interface ItoStateForPlayer {
  mode: ItoMode;
  roundsConfig: ItoRoundsConfig;
  theme: string;
  phase: ItoPhase;
  round: number;
  cards: Record<PlayerId, ItoCardInfo>;
  lastRoundResult: ItoRoundResult | null;

  /** Sempre o número verdadeiro do próprio jogador — nunca o de outros. */
  myNumber: number;

  /**
   * Ordem do quadro que esse jogador deve ver:
   * - modo "consensus": o quadro compartilhado (igual pra todos).
   * - modo "individual": só o palpite privado desse jogador.
   */
  board: PlayerId[];

  /** Quem já confirmou "pronto" nessa fase — pra mostrar "2/3 prontos" na tela. */
  readyToReveal: PlayerId[];
  readyForNextRound: PlayerId[];

  teamScore?: number;
  individualWins?: Record<PlayerId, number>;
}
