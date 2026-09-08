import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/models/catalog.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';
import '../../shared/widgets/cj_player_chip.dart';

/// Sala aberta: código, lista de jogadores e — só pro host — o catálogo de
/// jogos. Espelha `features/lobby` da web.
class LobbyPage extends ConsumerWidget {
  const LobbyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final room = ref.watch(roomControllerProvider);
    final ctrl = ref.read(roomControllerProvider.notifier);
    var hostName = 'o host';
    for (final p in room.players) {
      if (p.id == room.hostId) hostName = p.nickname;
    }

    return CjScreen(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: CjTokens.gap,
        children: [
          _CodeCard(code: room.code),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 8,
                children: [
                  Text(
                    '${room.players.length} jogador(es)',
                    style: TextStyle(fontSize: 13, color: CjTokens.muted),
                  ),
                  for (final p in room.players)
                    CjPlayerChip(
                      name: p.nickname,
                      host: p.id == room.hostId,
                      connected: p.connected,
                    ),
                ],
              ),
            ),
          ),
          if (room.isHost)
            _GamePicker(
              players: room.players.length,
              onPick: (id) {
                ctrl.clearError();
                ctrl.selectGame(id);
              },
            )
          else
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Aguardando $hostName escolher um jogo…',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: CjTokens.muted),
                ),
              ),
            ),
          if (room.error != null)
            Text(
              room.error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: CjTokens.danger),
            ),
          TextButton(onPressed: ctrl.leave, child: const Text('Sair da sala')),
        ],
      ),
    );
  }
}

class _CodeCard extends StatelessWidget {
  const _CodeCard({required this.code});
  final String code;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              'CÓDIGO DA SALA',
              style: TextStyle(fontSize: 11, letterSpacing: 2, color: CjTokens.muted),
            ),
            const SizedBox(height: 8),
            SelectableText(
              code,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    letterSpacing: 8,
                    color: CjTokens.glow,
                  ),
            ),
            const SizedBox(height: 4),
            TextButton.icon(
              onPressed: () =>
                  Clipboard.setData(ClipboardData(text: code)),
              icon: const Icon(Icons.copy, size: 15),
              label: const Text('copiar'),
            ),
            Text(
              'Passe o código pra galera entrar pelo celular',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: CjTokens.muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _GamePicker extends StatelessWidget {
  const _GamePicker({required this.players, required this.onPick});
  final int players;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 10,
          children: [
            Text(
              'ESCOLHA UM JOGO',
              style: TextStyle(fontSize: 11, letterSpacing: 1.6, color: CjTokens.muted),
            ),
            for (final g in gameCatalog)
              _GameTile(
                game: g,
                enabled: g.fits(players),
                onTap: () => onPick(g.id),
              ),
          ],
        ),
      ),
    );
  }
}

class _GameTile extends StatelessWidget {
  const _GameTile({required this.game, required this.enabled, required this.onTap});
  final GameCatalogEntry game;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Material(
        color: CjTokens.surface2.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              spacing: 12,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: game.accent.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(11),
                    border: Border.all(color: game.accent.withValues(alpha: 0.4)),
                  ),
                  child: Text(game.icon, style: const TextStyle(fontSize: 20)),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(game.displayName,
                          style: const TextStyle(fontWeight: FontWeight.w500)),
                      Text(
                        enabled
                            ? '${game.minPlayers}–${game.maxPlayers} jogadores · ${game.tagline}'
                            : 'precisa de ${game.minPlayers} a ${game.maxPlayers} jogadores',
                        style: TextStyle(
                          fontSize: 12,
                          color: enabled ? CjTokens.muted : CjTokens.warning,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
