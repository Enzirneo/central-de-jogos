/**
 * Metadados dos jogos disponíveis na plataforma — usados tanto pelo cliente
 * (pra listar jogos na tela) quanto pelo servidor (pra validar o id escolhido
 * e o número de jogadores antes de instanciar o `GamePlugin` de verdade).
 *
 * Este catálogo NÃO importa a implementação de nenhum jogo — só metadados.
 * A ligação entre `id` e o `GamePlugin` concreto (de `packages/games/*`)
 * acontece em `apps/server/src/games/registry.ts`, mantendo a regra do
 * CLAUDE.md de que a Central nunca conhece a lógica interna de um jogo.
 */
export interface GameCatalogEntry {
  id: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: "_template",
    displayName: "Contador (jogo de teste)",
    minPlayers: 1,
    maxPlayers: 12,
  },
  {
    id: "ito",
    displayName: "ITO",
    minPlayers: 3,
    maxPlayers: 8,
  },
];

export function findCatalogEntry(gameId: string): GameCatalogEntry | undefined {
  return GAME_CATALOG.find((entry) => entry.id === gameId);
}
