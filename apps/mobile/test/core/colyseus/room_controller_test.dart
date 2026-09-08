import 'dart:convert';

import 'package:central_de_jogos/core/colyseus/colyseus_client.dart';
import 'package:central_de_jogos/core/colyseus/room_controller.dart';
import 'package:central_de_jogos/core/colyseus/room_handle.dart';
import 'package:central_de_jogos/core/colyseus/room_state.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Sala falsa: guarda o que foi enviado e deixa o teste "emitir" mensagens.
class FakeRoomHandle implements RoomHandle {
  FakeRoomHandle({this.sessionId = 'me-1', this.reconnectionToken = 'room-1:tok'});

  @override
  String sessionId;
  @override
  String reconnectionToken;

  final sent = <({String type, Object? payload})>[];
  final _handlers = <String, void Function(Object?)>{};
  void Function(int)? _onLeave;

  @override
  void onMessage(String type, void Function(Object?) handler) =>
      _handlers[type] = handler;
  @override
  void onLeave(void Function(int) handler) => _onLeave = handler;
  @override
  void onError(void Function(int, String?) handler) {}
  @override
  void send(String type, [Object? payload]) =>
      sent.add((type: type, payload: payload));
  @override
  Future<void> leave() async => _onLeave?.call(1000);

  void emit(String type, Object? payload) => _handlers[type]?.call(payload);
  void drop(int code) => _onLeave?.call(code);
}

class FakeColyseusClient implements ColyseusClient {
  FakeColyseusClient(this.handle);
  FakeRoomHandle handle;
  FakeRoomHandle? reconnectResult;

  @override
  Future<RoomHandle> create(String nickname) async => handle;
  @override
  Future<RoomHandle> join(String code, String nickname) async => handle;
  @override
  Future<RoomHandle> reconnect(String token) async =>
      reconnectResult ?? (throw ColyseusException('sem reconexão'));

  @override
  String get baseHttpUrl => 'http://fake';
  @override
  void close() {}
}

Map<String, dynamic> lobby({
  String phase = 'lobby',
  String hostId = 'me-1',
  List<Map<String, dynamic>>? players,
}) =>
    {
      'code': 'ABCD',
      'phase': phase,
      'hostId': hostId,
      'activeGameId': '',
      'pendingGameId': '',
      'players': players ??
          [
            {'id': 'me-1', 'nickname': 'Ana', 'connected': true, 'ready': false},
          ],
    };

void main() {
  late FakeRoomHandle handle;
  late FakeColyseusClient client;
  late ProviderContainer container;

  RoomController ctrl() => container.read(roomControllerProvider.notifier);
  RoomState snap() => container.read(roomControllerProvider);

  setUp(() async {
    handle = FakeRoomHandle();
    client = FakeColyseusClient(handle);
    container = ProviderContainer(
      overrides: [colyseusClientProvider.overrideWithValue(client)],
    );
    await ctrl().create('Ana');
  });

  tearDown(() => container.dispose());

  test('conecta e identifica o próprio jogador como host', () {
    handle.emit(ServerEvents.lobbyState, lobby());
    expect(snap().connected, isTrue);
    expect(snap().mySessionId, 'me-1');
    expect(snap().isHost, isTrue);
    expect(snap().code, 'ABCD');
  });

  test('acompanha a fase da sala', () {
    handle.emit(ServerEvents.lobbyState, lobby(phase: 'starting'));
    expect(snap().phase, RoomPhase.starting);
  });

  test('game_state e game_over são exclusivos', () {
    handle.emit(ServerEvents.gameState, {'foo': 1});
    expect(snap().gameState, {'foo': 1});
    handle.emit(ServerEvents.gameOver, {'winner': 'me-1'});
    expect(snap().gameState, isNull);
    expect(snap().results, {'winner': 'me-1'});
  });

  test('start_game_error vira mensagem de erro', () {
    handle.emit(ServerEvents.startGameError, {'message': 'jogadores de menos'});
    expect(snap().error, 'jogadores de menos');
  });

  test('comandos enviam o evento certo', () {
    ctrl().selectGame('ito', {'mode': 'consensus'});
    ctrl().toggleReady();
    ctrl().sendAction({'type': 'increment'});
    expect(handle.sent.map((e) => '${e.type} ${jsonEncode(e.payload)}'), [
      'select_game {"gameId":"ito","options":{"mode":"consensus"}}',
      'toggle_ready null',
      'game_action {"type":"increment"}',
    ]);
  });

  test('queda não-limpa dispara reconexão e re-liga', () async {
    final nova = FakeRoomHandle(sessionId: 'me-1', reconnectionToken: 'room-1:t2');
    client.reconnectResult = nova;

    handle.drop(4000);
    expect(snap().reconnecting, isTrue);
    await Future<void>.delayed(Duration.zero);
    expect(snap().reconnecting, isFalse);
    expect(snap().connected, isTrue);

    nova.emit(ServerEvents.lobbyState, lobby());
    expect(snap().code, 'ABCD');
  });

  test('saída limpa (código 1000) não reconecta', () {
    handle.drop(1000);
    expect(snap().reconnecting, isFalse);
    expect(snap().connected, isFalse);
  });
}
