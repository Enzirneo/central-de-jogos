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
  /** Emoji mostrado no card do jogo. */
  icon: string;
  /** Cor de destaque do jogo (CSS color). A tela do jogo usa como --cj-game-accent. */
  accent: string;
  /** Frase curta pro card. */
  tagline: string;
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: "_template",
    displayName: "Contador",
    minPlayers: 1,
    maxPlayers: 12,
    icon: "🔢",
    accent: "hsl(152 40% 52%)",
    tagline: "Jogo de teste — clique até o alvo.",
  },
  {
    id: "ito",
    displayName: "ITO",
    minPlayers: 3,
    maxPlayers: 8,
    icon: "🌡️",
    accent: "hsl(190 75% 55%)",
    tagline: "Ordenem os números sem falar.",
  },
];

export function findCatalogEntry(gameId: string): GameCatalogEntry | undefined {
  return GAME_CATALOG.find((entry) => entry.id === gameId);
}
