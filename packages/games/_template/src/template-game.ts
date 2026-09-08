import type { GamePlugin, GameResults, PlayerId } from "@central-de-jogos/protocol";

/** Quantas vezes cada jogador precisa clicar até o jogo terminar. */
export const TARGET_COUNT = 5;

export interface TemplateGameState {
  counters: Record<PlayerId, number>;
}

export type TemplateGameAction = { type: "increment" };

export interface TemplateGameStateForPlayer {
  myCount: number;
  target: number;
  counters: Record<PlayerId, number>;
}

export const templateGame: GamePlugin<TemplateGameState, TemplateGameAction> = {
  id: "_template",
  displayName: "Contador (jogo de teste)",
  minPlayers: 1,
  maxPlayers: 12,

  createInitialState(players: PlayerId[]): TemplateGameState {
    const counters: Record<PlayerId, number> = {};
    for (const playerId of players) {
      counters[playerId] = 0;
    }
    return { counters };
  },

  applyAction(state, playerId, action): TemplateGameState {
    if (action?.type !== "increment") {
      return state;
    }

    const current = state.counters[playerId] ?? 0;
    if (current >= TARGET_COUNT) {
      return state;
    }

    return {
      counters: { ...state.counters, [playerId]: current + 1 },
    };
  },

  isGameOver(state): boolean {
    const counts = Object.values(state.counters);
    return counts.length > 0 && counts.every((count) => count >= TARGET_COUNT);
  },

  getResults(state): GameResults {
    return {
      target: TARGET_COUNT,
      counters: { ...state.counters },
    };
  },

  getStateForPlayer(state, playerId): TemplateGameStateForPlayer {
    // Jogo de teste não esconde nada de ninguém — todo mundo vê o contador
    // de todo mundo. Jogos reais podem usar esse ponto pra filtrar info.
    return {
      myCount: state.counters[playerId] ?? 0,
      target: TARGET_COUNT,
      counters: { ...state.counters },
    };
  },
};
