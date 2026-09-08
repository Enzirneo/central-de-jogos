import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/games/game_registry.dart';
import '../../core/models/wire.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';
import '../lobby/lobby_page.dart';
import '../ready_check/ready_check_page.dart';
import '../results/results_page.dart';

/// Container da sala. Uma rota (`/sala`) — resultado de jogo tem prioridade,
/// senão a tela segue `room.phase`. Espelha `features/sala/sala-page` da web.
class SalaPage extends ConsumerWidget {
  const SalaPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final room = ref.watch(roomControllerProvider);

    ref.listen(
      roomControllerProvider.select((s) => s.connected || s.reconnecting),
      (_, alive) {
        if (!alive) context.go('/');
      },
    );

    final Widget body;
    if (room.results != null) {
      body = const ResultsPage();
    } else {
      body = switch (room.phase) {
        RoomPhase.starting => const ReadyCheckPage(),
        RoomPhase.playing => _GameHost(gameId: room.activeGameId),
        RoomPhase.lobby => const LobbyPage(),
      };
    }

    return Stack(
      children: [
        body,
        if (room.reconnecting)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Material(
              color: CjTokens.warning.withValues(alpha: 0.15),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Text(
                    'Reconectando à sala…',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: CjTokens.warning, fontSize: 13),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Carrega a tela do jogo ativo pelo `game_registry`.
class _GameHost extends StatelessWidget {
  const _GameHost({required this.gameId});
  final String gameId;

  @override
  Widget build(BuildContext context) {
    final builder = gameScreenFor(gameId);
    if (builder != null) return builder(context);
    return CjScreen(
      center: true,
      child: Text('Jogo "$gameId" ainda não tem tela no app.',
          textAlign: TextAlign.center),
    );
  }
}
