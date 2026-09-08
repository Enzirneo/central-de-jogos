import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/colyseus/room_controller.dart';
import '../../../core/theme/tokens.dart';
import '../../../shared/widgets/cj_screen.dart';
import 'ito_host_page.dart';
import 'ito_types.dart';

/// Fase `revealed`: números à mostra, resultado da rodada, ir pra próxima.
/// Espelha `ito-reveal.ts` da web.
class ItoRevealPage extends ConsumerWidget {
  const ItoRevealPage({super.key, required this.state});
  final ItoView state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = state;
    final me = ref.watch(roomControllerProvider.select((r) => r.mySessionId));
    final players = ref.watch(roomControllerProvider.select((r) => r.players));
    final result = s.lastRoundResult;
    final correct = result?.correctOrder ?? const [];
    final board = result?.finalBoard ?? s.board;
    final iAmReady = s.readyForNextRound.contains(me);
    final text = Theme.of(context).textTheme;

    String nameOf(String id) => players
        .where((p) => p.id == id)
        .map((p) => p.nickname)
        .fold('Jogador', (_, n) => n);

    final String headline;
    if (s.isConsensus) {
      headline = '${result?.correctPositions ?? 0} de ${correct.length} certas';
    } else if ((result?.winners ?? const []).isNotEmpty) {
      headline = 'Acertaram: ${result!.winners.map(nameOf).join(', ')}';
    } else {
      headline = 'Ninguém acertou a ordem toda';
    }

    return CjScreen(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: CjTokens.gap,
        children: [
          Column(children: [
            Text('ITO · RODADA ${s.round} REVELADA',
                style: TextStyle(letterSpacing: 1.4, fontSize: 11, color: itoAccent)),
            const SizedBox(height: 4),
            Text(headline, textAlign: TextAlign.center, style: text.headlineSmall),
            if (s.isConsensus)
              Text('Placar do grupo: ${s.teamScore ?? 0}',
                  style: TextStyle(color: CjTokens.muted)),
          ]),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(spacing: 6, children: [
                Text('ORDEM CERTA (MENOR → MAIOR)',
                    style: TextStyle(fontSize: 11, letterSpacing: 1.2, color: CjTokens.muted)),
                for (final (i, id) in correct.indexed)
                  _slot(
                    number: '${s.cards[id]?.number ?? '?'}',
                    name: id == me ? '${nameOf(id)} (você)' : nameOf(id),
                    clue: s.cards[id]?.clue ?? '…',
                    hit: i < board.length && board[i] == id,
                    showHit: s.isConsensus,
                  ),
              ]),
            ),
          ),
          if (s.canAdvance)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(spacing: 10, children: [
                  Text('${s.readyForNextRound.length} de ${correct.length} prontos',
                      style: TextStyle(fontSize: 13, color: CjTokens.muted)),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => ref
                          .read(roomControllerProvider.notifier)
                          .sendAction({'type': 'ready_for_next_round'}),
                      child: Text(iAmReady ? 'Ainda não…' : 'Próxima rodada'),
                    ),
                  ),
                  if (s.isEndless)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => ref
                            .read(roomControllerProvider.notifier)
                            .sendAction({'type': 'end_game'}),
                        child: const Text('Encerrar o jogo'),
                      ),
                    ),
                ]),
              ),
            )
          else
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Última rodada — resultado final chegando…',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: CjTokens.muted)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _slot({
    required String number,
    required String name,
    required String clue,
    required bool hit,
    required bool showHit,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: CjTokens.surface2.withValues(alpha: 0.5),
        border: hit && showHit
            ? Border.all(color: CjTokens.success.withValues(alpha: 0.5))
            : Border.all(color: CjTokens.border),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 36,
            child: Text(number,
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: itoAccent,
                )),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w500)),
                Text('"$clue"',
                    style: TextStyle(
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        color: CjTokens.muted)),
              ],
            ),
          ),
          if (showHit && hit)
            Text('✓', style: TextStyle(color: CjTokens.success, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
