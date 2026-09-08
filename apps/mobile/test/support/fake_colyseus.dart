import 'package:central_de_jogos/core/colyseus/colyseus_client.dart';
import 'package:central_de_jogos/core/colyseus/room_handle.dart';

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

Map<String, dynamic> lobbyState({
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
