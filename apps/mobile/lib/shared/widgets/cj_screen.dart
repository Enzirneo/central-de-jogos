import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';

/// Layout base de uma tela: fundo do tema, conteúdo centralizado com largura
/// máxima (bom pra tablet/web) e rolagem. Espelha o `<cj-screen>` da web.
class CjScreen extends StatelessWidget {
  const CjScreen({super.key, required this.child, this.center = false});

  final Widget child;
  final bool center;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(CjTokens.gap),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisAlignment:
                    center ? MainAxisAlignment.center : MainAxisAlignment.start,
                spacing: CjTokens.gap,
                children: [child],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
