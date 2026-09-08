import type { GamePlugin, GameResults, PlayerId } from "@central-de-jogos/protocol";
import { ITO_THEMES } from "./themes";
import type {
  ItoAction,
  ItoCardInfo,
  ItoMode,
  ItoRoundsConfig,
  ItoStartOptions,
  ItoState,
  ItoStateForPlayer,
} from "./types";

export * from "./types";

const DEFAULT_ROUNDS = 5;
const MAX_ROUNDS = 20;
const MAX_CLUE_LENGTH = 60;
const MIN_NUMBER = 1;
const MAX_NUMBER = 100;

function pickUniqueNumbers(count: number): number[] {
  const pool: number[] = [];
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) pool.push(n);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

function pickTheme(excludeTheme: string): string {
  const candidates = ITO_THEMES.filter((theme) => theme !== excludeTheme);
  const pool = candidates.length > 0 ? candidates : ITO_THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function isValidPermutation(order: unknown, players: PlayerId[]): order is PlayerId[] {
  if (!Array.isArray(order) || order.length !== players.length) return false;
  const seen = new Set<unknown>();
  for (const item of order) {
    if (typeof item !== "string" || seen.has(item)) return false;
    seen.add(item);
  }
  return players.every((playerId) => seen.has(playerId));
}

function normalizeOptions(raw: unknown): ItoStartOptions {
  const options = (raw ?? {}) as Partial<ItoStartOptions>;
  const mode: ItoMode = options.mode === "individual" ? "individual" : "consensus";

  let rounds: ItoRoundsConfig;
  const rawRounds = options.rounds as { type?: unknown; totalRounds?: unknown } | undefined;

  if (rawRounds?.type === "endless") {
    rounds = { type: "endless" };
  } else {
    const requested = rawRounds?.totalRounds;
    const totalRounds =
      typeof requested === "number" && Number.isInteger(requested) && requested > 0 && requested <= MAX_ROUNDS
        ? requested
        : DEFAULT_ROUNDS;
    rounds = { type: "fixed", totalRounds };
  }

  return { mode, rounds };
}

function startRound(state: ItoState): ItoState {
  const numbers = pickUniqueNumbers(state.players.length);
  const roundData: ItoState["roundData"] = {};
  state.players.forEach((playerId, index) => {
    roundData[playerId] = { secretNumber: numbers[index], clue: null };
  });

  return {
    ...state,
    theme: pickTheme(state.theme),
    phase: "giving_clues",
    round: state.round + 1,
    roundData,
    sharedBoard: [],
    individualBoards: {},
    lastRoundResult: null,
    readyToReveal: [],
    readyForNextRound: [],
  };
}

function handleSubmitClue(state: ItoState, playerId: PlayerId, rawClue: unknown): ItoState {
  if (state.phase !== "giving_clues") return state;
  if (!state.players.includes(playerId)) return state;

  const clue = typeof rawClue === "string" ? rawClue.trim().slice(0, MAX_CLUE_LENGTH) : "";
  if (!clue) return state;

  const roundData = {
    ...state.roundData,
    [playerId]: { ...state.roundData[playerId], clue },
  };

  const allSubmitted = state.players.every((p) => roundData[p].clue !== null);
  if (!allSubmitted) {
    return { ...state, roundData };
  }

  if (state.mode === "consensus") {
    return { ...state, roundData, phase: "organizing", sharedBoard: [...state.players] };
  }

  const individualBoards: Record<PlayerId, PlayerId[]> = {};
  for (const p of state.players) individualBoards[p] = [...state.players];
  return { ...state, roundData, phase: "organizing", individualBoards };
}

function handleReorderBoard(state: ItoState, playerId: PlayerId, order: unknown): ItoState {
  if (state.phase !== "organizing") return state;
  if (!isValidPermutation(order, state.players)) return state;

  if (state.mode === "consensus") {
    // O quadro é compartilhado — qualquer reordenação invalida as confirmações
    // de "pronto" anteriores, já que a ordem que elas confirmavam mudou.
    return { ...state, sharedBoard: [...order], readyToReveal: [] };
  }

  return {
    ...state,
    individualBoards: { ...state.individualBoards, [playerId]: [...order] },
    // No modo individual só o palpite desse jogador mudou, então só ele
    // precisa reconfirmar — não afeta a confirmação dos outros.
    readyToReveal: state.readyToReveal.filter((id) => id !== playerId),
  };
}

function toggleReady(list: PlayerId[], playerId: PlayerId): PlayerId[] {
  return list.includes(playerId) ? list.filter((id) => id !== playerId) : [...list, playerId];
}

function handleReadyToReveal(state: ItoState, playerId: PlayerId): ItoState {
  if (state.phase !== "organizing") return state;
  if (!state.players.includes(playerId)) return state;

  const readyToReveal = toggleReady(state.readyToReveal, playerId);
  const next = { ...state, readyToReveal };

  if (readyToReveal.length === state.players.length) {
    return performReveal(next);
  }
  return next;
}

function handleReadyForNextRound(state: ItoState, playerId: PlayerId): ItoState {
  if (state.phase !== "revealed") return state;
  if (!state.players.includes(playerId)) return state;
  // Se já é a última rodada fixa, o jogo termina sozinho (isGameOver) assim
  // que a revelação acontece — não existe "próxima rodada" pra confirmar.
  if (state.roundsConfig.type === "fixed" && state.round >= state.roundsConfig.totalRounds) return state;

  const readyForNextRound = toggleReady(state.readyForNextRound, playerId);
  if (readyForNextRound.length === state.players.length) {
    return startRound({ ...state, readyForNextRound });
  }
  return { ...state, readyForNextRound };
}

function performReveal(state: ItoState): ItoState {
  const correctOrder = [...state.players].sort(
    (a, b) => state.roundData[a].secretNumber - state.roundData[b].secretNumber
  );

  if (state.mode === "consensus") {
    const finalBoard = state.sharedBoard.length === state.players.length ? state.sharedBoard : [...state.players];
    const correctPositions = finalBoard.filter((playerId, index) => playerId === correctOrder[index]).length;

    return {
      ...state,
      phase: "revealed",
      teamScore: state.teamScore + correctPositions,
      lastRoundResult: { correctOrder, finalBoard, correctPositions },
    };
  }

  const winners = state.players.filter((playerId) => {
    const board = state.individualBoards[playerId] ?? [];
    return board.length === correctOrder.length && board.every((id, index) => id === correctOrder[index]);
  });

  const individualWins = { ...state.individualWins };
  for (const winner of winners) {
    individualWins[winner] = (individualWins[winner] ?? 0) + 1;
  }

  return {
    ...state,
    phase: "revealed",
    individualWins,
    lastRoundResult: { correctOrder, winners },
  };
}

function handleEndGame(state: ItoState): ItoState {
  if (state.roundsConfig.type !== "endless") return state;
  if (state.phase !== "revealed") return state;
  return { ...state, endedManually: true };
}

export const itoGame: GamePlugin<ItoState, ItoAction, ItoStartOptions> = {
  id: "ito",
  displayName: "ITO",
  minPlayers: 3,
  maxPlayers: 8,

  createInitialState(players: PlayerId[], rawOptions?: ItoStartOptions): ItoState {
    const { mode, rounds } = normalizeOptions(rawOptions);

    const base: ItoState = {
      mode,
      roundsConfig: rounds,
      players: [...players],
      theme: "",
      phase: "giving_clues",
      round: 0,
      roundData: {},
      sharedBoard: [],
      individualBoards: {},
      teamScore: 0,
      individualWins: Object.fromEntries(players.map((p) => [p, 0])),
      endedManually: false,
      lastRoundResult: null,
      readyToReveal: [],
      readyForNextRound: [],
    };

    return startRound(base);
  },

  applyAction(state: ItoState, playerId: PlayerId, action: ItoAction): ItoState {
    switch (action?.type) {
      case "submit_clue":
        return handleSubmitClue(state, playerId, action.clue);
      case "reorder_board":
        return handleReorderBoard(state, playerId, action.order);
      case "ready_to_reveal":
        return handleReadyToReveal(state, playerId);
      case "ready_for_next_round":
        return handleReadyForNextRound(state, playerId);
      case "end_game":
        return handleEndGame(state);
      default:
        return state;
    }
  },

  isGameOver(state: ItoState): boolean {
    if (state.phase !== "revealed") return false;
    if (state.roundsConfig.type === "fixed") return state.round >= state.roundsConfig.totalRounds;
    return state.endedManually;
  },

  getResults(state: ItoState): GameResults {
    if (state.mode === "consensus") {
      return { mode: "consensus", teamScore: state.teamScore, rounds: state.round };
    }
    return { mode: "individual", wins: { ...state.individualWins }, rounds: state.round };
  },

  getStateForPlayer(state: ItoState, playerId: PlayerId): ItoStateForPlayer {
    const revealed = state.phase === "revealed";

    const cards: Record<PlayerId, ItoCardInfo> = {};
    for (const p of state.players) {
      const data = state.roundData[p];
      const clueVisible = state.phase !== "giving_clues" || p === playerId;
      cards[p] = {
        playerId: p,
        hasSubmittedClue: data.clue !== null,
        clue: clueVisible ? data.clue : null,
        number: revealed ? data.secretNumber : null,
      };
    }

    const base = {
      mode: state.mode,
      roundsConfig: state.roundsConfig,
      theme: state.theme,
      phase: state.phase,
      round: state.round,
      cards,
      lastRoundResult: state.lastRoundResult,
      myNumber: state.roundData[playerId]?.secretNumber ?? 0,
      readyToReveal: [...state.readyToReveal],
      readyForNextRound: [...state.readyForNextRound],
    };

    if (state.mode === "consensus") {
      return { ...base, board: [...state.sharedBoard], teamScore: state.teamScore };
    }

    return {
      ...base,
      board: [...(state.individualBoards[playerId] ?? state.players)],
      individualWins: { ...state.individualWins },
    };
  },
};
