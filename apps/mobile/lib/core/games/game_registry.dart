import 'package:flutter/widgets.dart';

import '../../features/games/ito/ito_config.dart';
import '../../features/games/ito/ito_host_page.dart';
import '../../features/games/template_counter_page.dart';

/// Mapa `id do jogo → widget da tela`. Espelha `game-registry.ts` da web e o
/// `registry.ts` do servidor: a Central nunca importa um jogo direto, só por
/// aqui. Jogo novo = uma linha aqui + a pasta em `features/games/`.
const gameScreens = <String, WidgetBuilder>{
  '_template': _templateBuilder,
  'ito': _itoBuilder,
};

Widget _templateBuilder(BuildContext _) => const TemplateCounterPage();
Widget _itoBuilder(BuildContext _) => const ItoHostPage();

/// Telas de config pré-jogo (opcionais). Só jogos com opções que o host escolhe
/// antes de começar (modo, rodadas) entram aqui — aparece na tela de "pronto".
const gameConfigScreens = <String, WidgetBuilder>{
  'ito': _itoConfigBuilder,
};

Widget _itoConfigBuilder(BuildContext _) => const ItoConfig();

WidgetBuilder? gameConfigFor(String gameId) => gameConfigScreens[gameId];

WidgetBuilder? gameScreenFor(String gameId) => gameScreens[gameId];
