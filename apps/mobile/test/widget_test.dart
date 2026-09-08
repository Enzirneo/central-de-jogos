import 'package:central_de_jogos/app.dart';
import 'package:central_de_jogos/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('app sobe e mostra a home', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: CentralDeJogosApp()));
    await tester.pumpAndSettle();

    expect(find.text('Central de Jogos'), findsOneWidget);
  });

  test('tema é escuro', () {
    expect(buildAppTheme().brightness, Brightness.dark);
  });
}
