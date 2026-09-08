import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';

/// Placeholder da home enquanto o lobby não existe (`feat/mobile-lobby`).
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return CjScreen(
      center: true,
      child: Column(
        spacing: 12,
        children: [
          Text('🎲', style: TextStyle(fontSize: 56)),
          Text('Central de Jogos', style: text.headlineMedium),
          Text(
            'Cria uma sala, chama a galera pelo código, joga.',
            textAlign: TextAlign.center,
            style: text.bodyMedium?.copyWith(color: CjTokens.muted),
          ),
          const SizedBox(height: 8),
          Text(
            'app mobile — em construção',
            style: text.labelSmall?.copyWith(
              color: CjTokens.glow,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
