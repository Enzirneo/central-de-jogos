import 'dart:ui';

/// Espelho de `packages/protocol/src/catalog.ts`. Metadados dos jogos — o
/// servidor valida o `id` e o nº de jogadores; o cliente usa pra montar a tela.
class GameCatalogEntry {
  const GameCatalogEntry({
    required this.id,
    required this.displayName,
    required this.minPlayers,
    required this.maxPlayers,
    required this.icon,
    required this.accent,
    required this.tagline,
  });

  final String id;
  final String displayName;
  final int minPlayers;
  final int maxPlayers;
  final String icon;
  final Color accent;
  final String tagline;

  bool fits(int players) => players >= minPlayers && players <= maxPlayers;
}

const gameCatalog = <GameCatalogEntry>[
  GameCatalogEntry(
    id: '_template',
    displayName: 'Contador',
    minPlayers: 1,
    maxPlayers: 12,
    icon: '🔢',
    accent: Color(0xFF52B788), // hsl(152 40% 52%)
    tagline: 'Jogo de teste — clique até o alvo.',
  ),
  GameCatalogEntry(
    id: 'ito',
    displayName: 'ITO',
    minPlayers: 3,
    maxPlayers: 8,
    icon: '🌡️',
    accent: Color(0xFF3FC7E0), // hsl(190 75% 55%)
    tagline: 'Ordenem os números sem falar.',
  ),
];

GameCatalogEntry? findCatalogEntry(String id) {
  for (final e in gameCatalog) {
    if (e.id == id) return e;
  }
  return null;
}
