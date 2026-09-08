import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/models/catalog.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';
import '../../shared/widgets/cj_player_chip.dart';

/// Fase `starting`: todo mundo confirma "pronto" e o jogo começa.
/// Espelha `features/ready-check` da web.
class ReadyCheckPage extends ConsumerWidget {
  const ReadyCheckPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final room = ref.watch(roomControllerProvider);
    final ctrl = ref.read(roomControllerProvider.notifier);
    final game = findCatalogEntry(room.pendingGameId);
    final readyCount = room.players.where((p) => p.ready).length;
    final iAmReady = room.me?.ready ?? false;

    return CjScreen(
      center: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: CjTokens.gap,
        children: [
          Column(
            children: [
              Text(game?.icon ?? '🎮', style: const TextStyle(fontSize: 32)),
              const SizedBox(height: 6),
              Text(game?.displayName ?? 'Jogo',
                  style: Theme.of(context).textTheme.headlineSmall),
              Text('Todo mundo pronto e o jogo começa.',
                  style: TextStyle(color: CjTokens.muted)),
            ],
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 8,
                children: [
                  for (final p in room.players)
                    CjPlayerChip(
                      name: p.nickname,
                      host: p.id == room.hostId,
                      ready: p.ready,
                      connected: p.connected,
                    ),
                  Text(
                    '$readyCount de ${room.players.length} prontos',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: CjTokens.muted),
                  ),
                ],
              ),
            ),
          ),
          FilledButton(
            onPressed: ctrl.toggleReady,
            child: Text(iAmReady ? 'Ainda não…' : 'Estou pronto'),
          ),
          if (room.isHost)
            TextButton(
              onPressed: ctrl.cancelStart,
              child: const Text('Cancelar e voltar ao lobby'),
            ),
        ],
      ),
    );
  }
}
