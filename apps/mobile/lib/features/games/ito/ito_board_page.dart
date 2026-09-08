import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/colyseus/room_controller.dart';
import '../../../core/theme/tokens.dart';
import '../../../shared/widgets/cj_screen.dart';
import 'ito_host_page.dart';
import 'ito_types.dart';

/// Fase `organizing`: arrastar as cartas pra ordenar do menor pro maior, só
/// pelas dicas. Espelha `ito-board.ts` da web.
class ItoBoardPage extends ConsumerStatefulWidget {
  const ItoBoardPage({super.key, required this.state});
  final ItoView state;

  @override
  ConsumerState<ItoBoardPage> createState() => _ItoBoardPageState();
}

class _ItoBoardPageState extends ConsumerState<ItoBoardPage> {
  List<String>? _order;

  /// Cópia de trabalho: reseta quando o servidor manda um quadro novo.
  List<String> get _working {
    final server = widget.state.board;
    if (_order == null || !_sameSet(_order!, server)) {
      _order = List.of(server);
    }
    return _order!;
  }

  bool _sameSet(List<String> a, List<String> b) =>
      a.length == b.length && a.toSet().containsAll(b);

  /// `newIndex` já vem ajustado pra remoção em `oldIndex`.
  void _onReorderItem(int oldIndex, int newIndex) {
    setState(() {
      final next = List.of(_working);
      next.insert(newIndex, next.removeAt(oldIndex));
      _order = next;
    });
    ref
        .read(roomControllerProvider.notifier)
        .sendAction({'type': 'reorder_board', 'order': _order});
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final me = ref.watch(roomControllerProvider.select((r) => r.mySessionId));
    final players = ref.watch(roomControllerProvider.select((r) => r.players));
    final order = _working;
    final iAmReady = s.readyToReveal.contains(me);
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
            Text(
              'ITO · ${s.isConsensus ? 'QUADRO DO GRUPO' : 'SEU PALPITE'}',
              style: TextStyle(letterSpacing: 1.4, fontSize: 11, color: itoAccent),
            ),
            const SizedBox(height: 4),
            Text('Do menor pro maior', style: text.headlineSmall),
            Text('Segura e arrasta pra ordenar. Só as dicas — nada de números.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: CjTokens.muted)),
          ]),
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: order.length,
            onReorderItem: _onReorderItem,
            proxyDecorator: (child, _, _) => Material(
              color: Colors.transparent,
              child: child,
            ),
            itemBuilder: (context, i) {
              final id = order[i];
              return Padding(
                key: ValueKey(id),
                padding: const EdgeInsets.only(bottom: 6),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: CjTokens.surface2.withValues(alpha: 0.6),
                    border: Border.all(color: CjTokens.border),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 26,
                        child: Text('${i + 1}',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w700,
                              color: CjTokens.muted,
                            )),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(id == me ? '${nameOf(id)} (você)' : nameOf(id),
                                style: const TextStyle(fontWeight: FontWeight.w500)),
                            Text('"${s.cards[id]?.clue ?? '…'}"',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: CjTokens.muted)),
                          ],
                        ),
                      ),
                      Icon(Icons.drag_handle, color: CjTokens.muted, size: 20),
                    ],
                  ),
                ),
              );
            },
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(spacing: 10, children: [
                Text('${s.readyToReveal.length} de ${order.length} prontos pra revelar',
                    style: TextStyle(fontSize: 13, color: CjTokens.muted)),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => ref
                        .read(roomControllerProvider.notifier)
                        .sendAction({'type': 'ready_to_reveal'}),
                    child: Text(iAmReady ? 'Ainda não…' : 'Pronto pra revelar'),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
