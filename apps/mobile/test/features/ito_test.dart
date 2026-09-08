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

  testWidgets('organizing: lista as cartas arrastáveis com as dicas', (tester) async {
    final handle = FakeRoomHandle();
    final container = await connected(handle);
    addTearDown(container.dispose);
    handle.emit(ServerEvents.gameState, itoState(phase: 'organizing'));

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.byType(ReorderableListView), findsOneWidget);
    expect(find.text('Ana (você)'), findsOneWidget);
    expect(find.text('"dica-p2"'), findsOneWidget);
    expect(find.byIcon(Icons.drag_handle), findsNWidgets(3));
  });

  test('reordenar: insert(removeAt) produz a ordem certa (lógica do onReorderItem)', () {
    // `onReorderItem` já entrega newIndex ajustado pra remoção em oldIndex.
    List<String> move(List<String> l, int from, int to) {
      final next = List.of(l);
      next.insert(to, next.removeAt(from));
      return next;
    }

    expect(move(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c']);
    expect(move(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b']);
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
