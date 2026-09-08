import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';

/// Linha de um jogador na lista da sala. Espelha o `<cj-player-chip>` da web.
class CjPlayerChip extends StatelessWidget {
  const CjPlayerChip({
    super.key,
    required this.name,
    this.host = false,
    this.ready = false,
    this.connected = true,
  });

  final String name;
  final bool host;
  final bool ready;
  final bool connected;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: connected ? 1 : 0.45,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: CjTokens.surface2.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(10),
          border: ready ? Border.all(color: CjTokens.success.withValues(alpha: 0.5)) : null,
        ),
        child: Row(
          spacing: 8,
          children: [
            if (host) const Text('👑', style: TextStyle(fontSize: 13)),
            Expanded(
              child: Text(name, style: const TextStyle(fontWeight: FontWeight.w500)),
            ),
            if (!connected)
              Text('caiu', style: TextStyle(fontSize: 11, color: CjTokens.muted))
            else if (ready)
              Text('pronto',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 0.8,
                    color: CjTokens.success,
                  )),
          ],
        ),
      ),
    );
  }
}
