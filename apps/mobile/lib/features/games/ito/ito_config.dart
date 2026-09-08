import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/colyseus/room_controller.dart';
import '../../../core/theme/tokens.dart';
import 'ito_host_page.dart';

const _minRounds = 1;
const _maxRounds = 20;

/// Config pré-jogo do ITO, na tela de "pronto". Só o host edita; os outros veem
/// o resumo. Cada mudança manda o objeto inteiro via `setGameOptions`.
/// Espelha `ito-config.ts` da web.
class ItoConfig extends ConsumerWidget {
  const ItoConfig({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final room = ref.watch(roomControllerProvider);
    final ctrl = ref.read(roomControllerProvider.notifier);
    final raw = (room.pendingGameOptions as Map?)?.cast<String, dynamic>() ?? const {};
    final mode = raw['mode'] == 'individual' ? 'individual' : 'consensus';
    final rounds = (raw['rounds'] as Map?)?.cast<String, dynamic>();
    final endless = rounds?['type'] == 'endless';
    final total = (rounds?['totalRounds'] as num?)?.toInt() ?? 5;

    Map<String, dynamic> withMode(String m) =>
        {'mode': m, 'rounds': rounds ?? {'type': 'fixed', 'totalRounds': total}};
    void send(Map<String, dynamic> o) => ctrl.setGameOptions(o);

    if (!room.isHost) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Modo: ${mode == 'individual' ? 'Cada um por si' : 'Em equipe'} · '
            '${endless ? 'sem fim' : '$total rodada(s)'}',
            style: TextStyle(color: CjTokens.muted),
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 14,
          children: [
            Text('COMO PONTUA',
                style: TextStyle(fontSize: 11, letterSpacing: 1.4, color: CjTokens.muted)),
            _modeTile(
              title: 'Em equipe',
              subtitle: 'uma ordem só, todo mundo acerta ou erra junto',
              on: mode == 'consensus',
              onTap: () => send(withMode('consensus')),
            ),
            _modeTile(
              title: 'Cada um por si',
              subtitle: 'cada um faz a sua ordem, ganha ponto quem acertar',
              on: mode == 'individual',
              onTap: () => send(withMode('individual')),
            ),
            Text('RODADAS',
                style: TextStyle(fontSize: 11, letterSpacing: 1.4, color: CjTokens.muted)),
            Row(
              children: [
                IconButton.outlined(
                  onPressed: endless || total <= _minRounds
                      ? null
                      : () => send({
                            'mode': mode,
                            'rounds': {'type': 'fixed', 'totalRounds': total - 1},
                          }),
                  icon: const Icon(Icons.remove),
                ),
                Expanded(
                  child: Text(endless ? '∞' : '$total',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge),
                ),
                IconButton.outlined(
                  onPressed: endless || total >= _maxRounds
                      ? null
                      : () => send({
                            'mode': mode,
                            'rounds': {'type': 'fixed', 'totalRounds': total + 1},
                          }),
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Sem fim'),
              value: endless,
              onChanged: (on) => send({
                'mode': mode,
                'rounds': on
                    ? {'type': 'endless'}
                    : {'type': 'fixed', 'totalRounds': total},
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _modeTile({
    required String title,
    required String subtitle,
    required bool on,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: CjTokens.surface2.withValues(alpha: 0.5),
          border: Border.all(color: on ? itoAccent : CjTokens.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(subtitle, style: TextStyle(fontSize: 12, color: CjTokens.muted)),
          ],
        ),
      ),
    );
  }
}
