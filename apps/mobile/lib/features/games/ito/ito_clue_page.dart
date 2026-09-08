import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/colyseus/room_controller.dart';
import '../../../core/theme/tokens.dart';
import '../../../shared/widgets/cj_screen.dart';
import '../../../shared/widgets/cj_text_field.dart';
import 'ito_host_page.dart';
import 'ito_types.dart';

/// Fase `giving_clues`: cada um vê o próprio número e manda uma dica.
class ItoCluePage extends ConsumerStatefulWidget {
  const ItoCluePage({super.key, required this.state});
  final ItoView state;

  @override
  ConsumerState<ItoCluePage> createState() => _ItoCluePageState();
}

class _ItoCluePageState extends ConsumerState<ItoCluePage> {
  String _draft = '';

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final me = ref.watch(roomControllerProvider.select((r) => r.mySessionId));
    final players = ref.watch(roomControllerProvider.select((r) => r.players));
    final myCard = s.cards[me];
    final submitted = myCard?.hasSubmittedClue ?? false;
    final text = Theme.of(context).textTheme;

    String nameOf(String id) => players
        .where((p) => p.id == id)
        .map((p) => p.nickname)
        .fold('Jogador', (_, n) => n);

    return CjScreen(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: CjTokens.gap,
        children: [
          Column(children: [
            Text('ITO · RODADA ${s.round}${s.isEndless ? '' : '/${s.totalRounds}'}',
                style: TextStyle(letterSpacing: 1.6, fontSize: 11, color: itoAccent)),
            const SizedBox(height: 4),
            Text('Tema: ${s.theme}', style: text.headlineSmall, textAlign: TextAlign.center),
          ]),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(children: [
                Text('SEU NÚMERO',
                    style: TextStyle(fontSize: 11, letterSpacing: 1.4, color: CjTokens.muted)),
                Text('${s.myNumber}',
                    style: text.displaySmall?.copyWith(color: itoAccent)),
                Text(
                  'Descreva algo do tema com essa "intensidade" — sem dizer o número.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: CjTokens.muted),
                ),
              ]),
            ),
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: submitted
                  ? Text('✓ Dica enviada: "${myCard?.clue ?? ''}"')
                  : Column(spacing: 12, children: [
                      CjTextField(
                        label: 'Sua dica',
                        hintText: 'ex: café da manhã de domingo',
                        value: _draft,
                        maxLength: 60,
                        onChanged: (v) => setState(() => _draft = v),
                      ),
                      FilledButton(
                        onPressed: _draft.trim().isEmpty
                            ? null
                            : () => ref
                                .read(roomControllerProvider.notifier)
                                .sendAction({'type': 'submit_clue', 'clue': _draft.trim()}),
                        child: const Text('Enviar dica'),
                      ),
                    ]),
            ),
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 6,
                children: [
                  Text('QUEM JÁ MANDOU',
                      style: TextStyle(fontSize: 11, letterSpacing: 1.2, color: CjTokens.muted)),
                  for (final c in s.cards.values.where((c) => c.playerId != me))
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(nameOf(c.playerId)),
                        Text(c.hasSubmittedClue ? 'pronto' : 'pensando…',
                            style: TextStyle(
                              fontSize: 12,
                              color: c.hasSubmittedClue ? CjTokens.success : CjTokens.muted,
                            )),
                      ],
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
