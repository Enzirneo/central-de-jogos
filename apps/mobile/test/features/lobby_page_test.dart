import 'package:central_de_jogos/core/colyseus/room_controller.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:central_de_jogos/core/theme/app_theme.dart';
import 'package:central_de_jogos/features/lobby/lobby_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/fake_colyseus.dart';

Future<ProviderContainer> connectedContainer(FakeRoomHandle handle,
    {String phase = 'lobby',
    String hostId = 'me-1',
    List<Map<String, dynamic>>? players}) async {
  final container = ProviderContainer(
    overrides: [
      colyseusClientProvider.overrideWithValue(FakeColyseusClient(handle)),
    ],
  );
  await container.read(roomControllerProvider.notifier).create('Ana');
  handle.emit(ServerEvents.lobbyState,
      lobbyState(phase: phase, hostId: hostId, players: players));
  return container;
}

Widget wrap(ProviderContainer c) => UncontrolledProviderScope(
      container: c,
      child: MaterialApp(theme: buildAppTheme(), home: const LobbyPage()),
    );

void main() {
  testWidgets('host vê código, jogadores e o catálogo de jogos', (tester) async {
    final container = await connectedContainer(
      FakeRoomHandle(),
      players: [
        {'id': 'me-1', 'nickname': 'Ana', 'connected': true, 'ready': false},
        {'id': 'p2', 'nickname': 'Beto', 'connected': true, 'ready': false},
        {'id': 'p3', 'nickname': 'Dora', 'connected': true, 'ready': false},
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.text('ABCD'), findsOneWidget);
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('Beto'), findsOneWidget);
    expect(find.text('Contador'), findsOneWidget);
    expect(find.text('ITO'), findsOneWidget); // 3 jogadores → cabe no ITO
  });

  testWidgets('não-host vê aviso de espera, não o catálogo', (tester) async {
    final container = await connectedContainer(
      FakeRoomHandle(sessionId: 'p2'),
      hostId: 'me-1',
      players: [
        {'id': 'me-1', 'nickname': 'Ana', 'connected': true, 'ready': false},
        {'id': 'p2', 'nickname': 'Beto', 'connected': true, 'ready': false},
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.textContaining('Aguardando Ana'), findsOneWidget);
    expect(find.text('Contador'), findsNothing);
  });

  testWidgets('tocar num jogo envia select_game', (tester) async {
    final handle = FakeRoomHandle();
    final container = await connectedContainer(handle, players: [
      {'id': 'me-1', 'nickname': 'Ana', 'connected': true, 'ready': false},
    ]);
    addTearDown(container.dispose);

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Contador'));

    expect(handle.sent.single.type, 'select_game');
    expect((handle.sent.single.payload! as Map)['gameId'], '_template');
  });
}
