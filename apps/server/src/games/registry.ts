import type { GamePlugin } from "@central-de-jogos/protocol";
import { templateGame } from "@central-de-jogos/game-template";
import { itoGame } from "@central-de-jogos/game-ito";

/**
 * Único lugar do servidor que conhece a implementação concreta de cada jogo.
 * A `LobbyRoom` só enxerga essa lista por `id` — nunca importa um jogo
 * específico diretamente, conforme a regra da seção 3 do CLAUDE.md.
 */
export const GAME_REGISTRY: Record<string, GamePlugin<any, any, any>> = {
  [templateGame.id]: templateGame,
  [itoGame.id]: itoGame,
};

export function getGamePlugin(gameId: string): GamePlugin<any, any, any> | undefined {
  return GAME_REGISTRY[gameId];
}
