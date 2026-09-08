import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';

/// Jogo de teste: cada um clica até o alvo. O estado vem inteiro de
/// `room.gameState`. Espelha `features/games/_template` da web.
class TemplateCounterPage extends ConsumerWidget {
  const TemplateCounterPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final room = ref.watch(roomControllerProvider);
    final state = (room.gameState as Map?) ?? const {};
    final target = (state['target'] as num?)?.toInt() ?? 0;
    final myCount = (state['myCount'] as num?)?.toInt() ?? 0;
    final counters = (state['counters'] as Map?) ?? const {};
    final me = room.mySessionId;

    final rows = counters.entries.map((e) {
      final id = e.key.toString();
      return (
        id: id,
        count: (e.value as num).toInt(),
        self: id == me,
        name: room.players
            .where((p) => p.id == id)
            .map((p) => p.nickname)
            .fold<String>('Jogador', (_, n) => n),
      );
    }).toList()
      ..sort((a, b) => b.count.compareTo(a.count));

    final text = Theme.of(context).textTheme;

    return CjScreen(
      center: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: CjTokens.gap,
        children: [
          Column(
            children: [
              Text('🔢 CONTADOR',
                  style: TextStyle(letterSpacing: 2, fontSize: 12, color: CjTokens.glow)),
              const SizedBox(height: 4),
              Text('Clique até $target', style: text.headlineSmall),
            ],
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text('$myCount',
                      style: text.displaySmall?.copyWith(color: CjTokens.glow)),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => ref
                        .read(roomControllerProvider.notifier)
                        .sendAction({'type': 'increment'}),
                    child: const Text('Incrementar'),
                  ),
                ],
              ),
            ),
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                spacing: 6,
                children: [
                  for (final r in rows)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: CjTokens.surface2.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(10),
                        border: r.self
                            ? Border.all(color: CjTokens.glow.withValues(alpha: 0.4))
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(r.name),
                          Text('${r.count} / $target',
                              style: TextStyle(color: CjTokens.muted)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
