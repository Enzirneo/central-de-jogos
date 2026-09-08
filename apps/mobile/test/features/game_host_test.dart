import 'package:central_de_jogos/core/colyseus/room_controller.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:central_de_jogos/core/theme/app_theme.dart';
import 'package:central_de_jogos/features/results/results_page.dart';
import 'package:central_de_jogos/features/sala/sala_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import '../support/fake_colyseus.dart';

Future<ProviderContainer> connected(FakeRoomHandle handle) async {
  final c = ProviderContainer(
    overrides: [
      colyseusClientProvider.overrideWithValue(FakeColyseusClient(handle)),
    ],
  );
  await c.read(roomControllerProvider.notifier).create('Ana');
  return c;
}

Widget wrap(ProviderContainer c, Widget child) => UncontrolledProviderScope(
      container: c,
      child: MaterialApp.router(
        theme: buildAppTheme(),
        routerConfig: GoRouter(
          routes: [GoRoute(path: '/', builder: (_, _) => child)],
        ),
      ),
    );

void main() {
  testWidgets('fase playing mostra o Contador e Incrementar envia game_action',
      (tester) async {
    final handle = FakeRoomHandle();
    final container = await connected(handle);
    addTearDown(container.dispose);
    handle.emit(ServerEvents.lobbyState, lobbyState(phase: 'playing'));
    handle.emit(ServerEvents.gameState, {
      'myCount': 2,
      'target': 5,
      'counters': {'me-1': 2},
    });
    // o lobby_state com phase=playing seta activeGameId? não — vem vazio no
    // fixture. Emite um com activeGameId preenchido.
    handle.emit(ServerEvents.lobbyState, {
      ...lobbyState(phase: 'playing'),
      'activeGameId': '_template',
    });

    await tester.pumpWidget(wrap(container, const SalaPage()));
    await tester.pumpAndSettle();

    expect(find.text('2'), findsOneWidget);
    expect(find.text('Clique até 5'), findsOneWidget);

    await tester.tap(find.text('Incrementar'));
    expect(handle.sent.last.type, 'game_action');
  });

  testWidgets('results mostra ranking e "Voltar ao lobby" limpa o resultado',
      (tester) async {
    final handle = FakeRoomHandle();
    final container = await connected(handle);
    addTearDown(container.dispose);
    handle.emit(ServerEvents.gameOver, {
      'target': 5,
      'counters': {'me-1': 5, 'p2': 3},
    });

    await tester.pumpWidget(wrap(container, const ResultsPage()));
    await tester.pump(); // não pumpAndSettle: o confetti anima

    expect(find.text('5'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);

    await tester.tap(find.text('Voltar ao lobby'));
    await tester.pump();
    expect(container.read(roomControllerProvider).results, isNull);
  });
}
