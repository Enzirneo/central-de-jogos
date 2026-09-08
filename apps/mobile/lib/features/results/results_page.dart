import 'dart:math';

import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';

/// Tela de fim de jogo. Aparece enquanto `room.results` tem valor (o `SalaPage`
/// mostra por cima da fase). Lê o `GameResults` de forma genérica.
/// Espelha `features/results` da web.
class ResultsPage extends ConsumerStatefulWidget {
  const ResultsPage({super.key});

  @override
  ConsumerState<ResultsPage> createState() => _ResultsPageState();
}

class _ResultsPageState extends ConsumerState<ResultsPage> {
  final _confetti = ConfettiController(duration: const Duration(seconds: 2));

  @override
  void initState() {
    super.initState();
    _confetti.play();
  }

  @override
  void dispose() {
    _confetti.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final room = ref.watch(roomControllerProvider);
    final results = room.results ?? const {};
    final text = Theme.of(context).textTheme;

    final table = (results['counters'] ?? results['wins']) as Map?;
    final ranking = <({String name, num value, bool self})>[];
    if (table != null) {
      for (final e in table.entries) {
        final id = e.key.toString();
        ranking.add((
          name: room.players
              .where((p) => p.id == id)
              .map((p) => p.nickname)
              .fold<String>('Jogador', (_, n) => n),
          value: e.value as num,
          self: id == room.mySessionId,
        ));
      }
      ranking.sort((a, b) => b.value.compareTo(a.value));
    }

    final headline = results['teamScore'] is num
        ? 'Placar do grupo: ${results['teamScore']} em ${results['rounds'] ?? '?'} rodada(s)'
        : ranking.isNotEmpty
            ? '${ranking.first.name} na frente!'
            : 'Jogo encerrado';

    return Stack(
      alignment: Alignment.topCenter,
      children: [
        CjScreen(
          center: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: CjTokens.gap,
            children: [
              Column(
                children: [
                  Text('FIM DE JOGO',
                      style: TextStyle(letterSpacing: 3, fontSize: 12, color: CjTokens.glow)),
                  const SizedBox(height: 6),
                  Text(headline, textAlign: TextAlign.center, style: text.headlineSmall),
                ],
              ),
              if (ranking.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      spacing: 6,
                      children: [
                        for (final (i, r) in ranking.indexed)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: CjTokens.surface2.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(10),
                              border: i == 0
                                  ? Border.all(color: CjTokens.warning.withValues(alpha: 0.4))
                                  : null,
                            ),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 24,
                                  child: Text('${i + 1}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: i == 0 ? CjTokens.warning : CjTokens.muted,
                                      )),
                                ),
                                Expanded(child: Text(r.self ? '${r.name} (você)' : r.name)),
                                Text('${r.value}',
                                    style: const TextStyle(fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              FilledButton(
                onPressed: ref.read(roomControllerProvider.notifier).dismissResults,
                child: const Text('Voltar ao lobby'),
              ),
            ],
          ),
        ),
        ConfettiWidget(
          confettiController: _confetti,
          blastDirection: pi / 2,
          maxBlastForce: 20,
          numberOfParticles: 20,
          gravity: 0.25,
        ),
      ],
    );
  }
}
