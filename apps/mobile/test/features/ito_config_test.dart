import 'package:central_de_jogos/core/colyseus/room_controller.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:central_de_jogos/core/theme/app_theme.dart';
import 'package:central_de_jogos/features/ready_check/ready_check_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/fake_colyseus.dart';

Future<ProviderContainer> starting(FakeRoomHandle handle, {Object? options}) async {
  final c = ProviderContainer(
    overrides: [colyseusClientProvider.overrideWithValue(FakeColyseusClient(handle))],
  );
  await c.read(roomControllerProvider.notifier).create('Ana');
  handle.emit(ServerEvents.lobbyState, {
    ...lobbyState(phase: 'starting'),
    'pendingGameId': 'ito',
    'pendingGameOptions': options,
  });
  return c;
}

Widget wrap(ProviderContainer c) => UncontrolledProviderScope(
      container: c,
      child: MaterialApp(theme: buildAppTheme(), home: const ReadyCheckPage()),
    );

void main() {
  testWidgets('host vê a config do ITO e mudar o modo manda set_game_options',
      (tester) async {
    final handle = FakeRoomHandle();
    final container = await starting(handle);
    addTearDown(container.dispose);

    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.text('Em equipe'), findsOneWidget);
    expect(find.text('Cada um por si'), findsOneWidget);

    await tester.tap(find.text('Cada um por si'));
    expect(handle.sent.last.type, 'set_game_options');
    final opts = (handle.sent.last.payload! as Map)['options'] as Map;
    expect(opts['mode'], 'individual');
  });

  testWidgets('não-host vê só o resumo da config', (tester) async {
    final handle = FakeRoomHandle(sessionId: 'p2');
    final container = await starting(
      handle,
      options: {'mode': 'individual', 'rounds': {'type': 'fixed', 'totalRounds': 3}},
    );
    addTearDown(container.dispose);

    // hostId no fixture é 'me-1'; este cliente é 'p2' → não-host
    await tester.pumpWidget(wrap(container));
    await tester.pumpAndSettle();

    expect(find.textContaining('Cada um por si'), findsOneWidget);
    expect(find.text('Em equipe'), findsNothing);
  });
}
