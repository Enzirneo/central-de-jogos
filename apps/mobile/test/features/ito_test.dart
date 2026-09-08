import 'package:central_de_jogos/core/colyseus/room_controller.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:central_de_jogos/core/theme/app_theme.dart';
import 'package:central_de_jogos/features/games/ito/ito_host_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/fake_colyseus.dart';

/// Formato de `game_state` do ITO consensus (espelha getStateForPlayer).
Map<String, dynamic> itoState({
  required String phase,
  int round = 1,
  List<String> board = const ['me-1', 'p2', 'p3'],
  Map<String, dynamic>? lastRoundResult,
  List<String> readyToReveal = const [],
}) =>
    {
      'mode': 'consensus',
      'roundsConfig': {'type': 'fixed', 'totalRounds': 3},
      'theme': 'comida',
      'phase': phase,
      'round': round,
      'myNumber': 42,
      'board': board,
      'readyToReveal': readyToReveal,
      'readyForNextRound': <String>[],
      'teamScore': 0,
      'lastRoundResult': lastRoundResult,
      'cards': {
        for (final id in ['me-1', 'p2', 'p3'])
          id: {
            'playerId': id,
            'hasSubmittedClue': phase != 'giving_clues',
            'clue': phase == 'giving_clues' ? null : 'dica-$id',
            'number': phase == 'revealed' ? {'me-1': 50, 'p2': 20, 'p3': 80}[id] : null,
          },
      },
    };

Future<ProviderContainer> connected(FakeRoomHandle handle) async {
  final c = ProviderContainer(
    overrides: [colyseusClientProvider.overrideWithValue(FakeColyseusClient(handle))],
  );
  await c.read(roomControllerProvider.notifier).create('Ana');
  handle.emit(ServerEvents.lobbyState, lobbyState(phase: 'playing'));
  return c;
}

Widget wrap(ProviderContainer c) => UncontrolledProviderScope(
      container: c,
      child: MaterialApp(theme: buildAppTheme(), home: const ItoHostPage()),
    );

void main() {
  testWidgets('giving_clues: enviar dica manda submit_clue', (tester) async {
    final handle = FakeRoomHandle();
    final container = await connected(handle);
    addTearDown(container.dispose);
    handle.emit(ServerEvents.gameState, itoState(phase: 'giving_clues'));

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.text('Tema: comida'), findsOneWidget);
    expect(find.text('42'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'gelo');
    await tester.pump();
    await tester.tap(find.text('Enviar dica'));
    expect(handle.sent.last.type, 'game_action');
    expect((handle.sent.last.payload! as Map)['clue'], 'gelo');
  });

  testWidgets('organizing: mover troca a ordem e manda reorder_board', (tester) async {
    final handle = FakeRoomHandle();
    final container = await connected(handle);
    addTearDown(container.dispose);
    handle.emit(ServerEvents.gameState, itoState(phase: 'organizing'));

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ana (você)')); // seleciona slot 0
    await tester.pump();
    await tester.tap(find.text('↓ descer'));
    await tester.pump();

    final sent = handle.sent.last;
    expect(sent.type, 'game_action');
    expect((sent.payload! as Map)['type'], 'reorder_board');
    expect((sent.payload! as Map)['order'], ['p2', 'me-1', 'p3']);
  });

  testWidgets('revealed: mostra números e ordem certa', (tester) async {
    final handle = FakeRoomHandle();
    final container = await connected(handle);
    addTearDown(container.dispose);
    handle.emit(
      ServerEvents.gameState,
      itoState(
        phase: 'revealed',
        lastRoundResult: {
          'correctOrder': ['p2', 'me-1', 'p3'],
          'finalBoard': ['me-1', 'p2', 'p3'],
          'correctPositions': 1,
        },
      ),
    );

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.text('1 de 3 certas'), findsOneWidget);
    expect(find.text('20'), findsOneWidget); // número do p2
    expect(find.text('Próxima rodada'), findsOneWidget);
  });
}
