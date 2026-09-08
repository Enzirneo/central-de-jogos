import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/colyseus/room_controller.dart';
import 'ito_board_page.dart';
import 'ito_clue_page.dart';
import 'ito_reveal_page.dart';
import 'ito_types.dart';

/// Accent do ITO (ciano) — espelha o `hsl(190 75% 55%)` do catálogo/web.
const itoAccent = Color(0xFF3FC7E0);

/// Container do ITO: lê `room.gameState` e mostra a tela da fase atual.
/// Espelha `ito-host.ts` da web.
class ItoHostPage extends ConsumerWidget {
  const ItoHostPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final raw = ref.watch(
      roomControllerProvider.select((s) => s.gameState),
    );
    if (raw is! Map) return const SizedBox.shrink();
    final s = ItoView(raw.cast<String, dynamic>());

    return switch (s.phase) {
      'giving_clues' => ItoCluePage(state: s),
      'organizing' => ItoBoardPage(state: s),
      'revealed' => ItoRevealPage(state: s),
      _ => const SizedBox.shrink(),
    };
  }
}
