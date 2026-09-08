import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/models/wire.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';
import '../lobby/lobby_page.dart';
import '../ready_check/ready_check_page.dart';

/// Container da sala. Uma rota (`/sala`) — a tela segue `room.phase`.
/// Espelha `features/sala/sala-page` da web. (A tela de jogo entra em
/// `feat/mobile-game-host`.)
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

    final body = switch (room.phase) {
      RoomPhase.starting => const ReadyCheckPage(),
      RoomPhase.playing => const _PlayingPlaceholder(),
      RoomPhase.lobby => const LobbyPage(),
    };

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

class _PlayingPlaceholder extends StatelessWidget {
  const _PlayingPlaceholder();

  @override
  Widget build(BuildContext context) {
    return CjScreen(
      center: true,
      child: Column(
        children: [
          const Text('🎮', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 8),
          Text('Jogo em andamento',
              style: Theme.of(context).textTheme.headlineSmall),
          Text('as telas de jogo vêm na próxima branch',
              style: TextStyle(color: CjTokens.muted)),
        ],
      ),
    );
  }
}
