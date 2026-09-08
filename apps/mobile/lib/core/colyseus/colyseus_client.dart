import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:msgpack_dart/msgpack_dart.dart' as msgpack;
import 'package:web_socket_channel/web_socket_channel.dart';

import 'msgpack_json.dart';
import 'room_handle.dart';

/// Cliente Colyseus mínimo, feito na mão. Fala só a parte do protocolo 0.16 que
/// a Central usa: matchmaking HTTP + o frame `ROOM_DATA` (mensagens JSON via
/// msgpack). NÃO decodifica `@colyseus/schema` — o servidor manda o lobby como
/// JSON (decisão da Fase 1, ver docs/PLANO §2.1).
///
/// Isolar o Colyseus atrás desta classe é de propósito (clean-code §7): se o
/// protocolo mudar, o estrago fica aqui.
class ColyseusClient {
  ColyseusClient(this.baseHttpUrl, {http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  /// Ex: `http://10.0.2.2:2567`.
  final String baseHttpUrl;
  final http.Client _http;

  Future<RoomHandle> create(String nickname) =>
      _matchmake('create', {'nickname': nickname});

  Future<RoomHandle> join(String code, String nickname) =>
      _matchmake('join', {'code': code.trim().toUpperCase(), 'nickname': nickname});

  /// `token` no formato `roomId:reconnectionToken` (o que `RoomHandle` expõe).
  Future<RoomHandle> reconnect(String token) {
    final sep = token.indexOf(':');
    if (sep < 0) throw ArgumentError('token de reconexão inválido: $token');
    final roomId = token.substring(0, sep);
    return _matchmake(
      'reconnect',
      {'reconnectionToken': token.substring(sep + 1)},
      roomNameOrId: roomId,
    );
  }

  Future<RoomHandle> _matchmake(
    String method,
    Map<String, dynamic> options, {
    String roomNameOrId = 'lobby',
  }) async {
    final res = await _http.post(
      Uri.parse('$baseHttpUrl/matchmake/$method/$roomNameOrId'),
      headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
      body: jsonEncode(options),
    );

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['error'] != null) {
      throw ColyseusException(body['error'].toString(), body['code'] as int?);
    }

    final room = body['room'] as Map<String, dynamic>;
    final sessionId = body['sessionId'] as String;
    final query = {
      'sessionId': sessionId,
      if (body['reconnectionToken'] != null)
        'reconnectionToken': body['reconnectionToken'] as String,
    };

    final wsBase = baseHttpUrl.replaceFirst(RegExp(r'^http'), 'ws');
    final host = room['publicAddress'] as String? ??
        wsBase.replaceFirst(RegExp(r'^wss?://'), '');
    final scheme = wsBase.startsWith('wss') ? 'wss' : 'ws';
    final uri = Uri.parse(
      '$scheme://$host/${room['processId']}/${room['roomId']}',
    ).replace(queryParameters: query);

    final channel = WebSocketChannel.connect(uri);
    final handle = ColyseusRoom._(channel, room['roomId'] as String, sessionId);
    await handle._waitForJoin();
    return handle;
  }

  void close() => _http.close();
}

class ColyseusException implements Exception {
  ColyseusException(this.message, [this.code]);
  final String message;
  final int? code;
  @override
  String toString() => 'ColyseusException($code): $message';
}

// --- protocolo 0.16 -----------------------------------------------------------

class _Protocol {
  static const joinRoom = 10;
  static const error = 11;
  static const leaveRoom = 12;
  static const roomData = 13;
}

class ColyseusRoom implements RoomHandle {
  ColyseusRoom._(this._channel, this._roomId, this.sessionId) {
    _sub = _channel.stream.listen(
      _onData,
      onError: (Object e) => _emitError(4000, e.toString()),
      onDone: _onDone,
    );
  }

  final WebSocketChannel _channel;
  final String _roomId;
  late final StreamSubscription<dynamic> _sub;

  @override
  final String sessionId;

  @override
  String reconnectionToken = '';

  final _messageHandlers = <String, void Function(Object?)>{};
  final _leaveHandlers = <void Function(int)>[];
  final _errorHandlers = <void Function(int, String?)>[];
  // Mensagens que chegaram antes do handler do tipo ser registrado (o servidor
  // manda o primeiro `lobby_state` logo depois do join). Entregues no onMessage.
  final _pending = <({String type, Object? payload})>[];
  final _joined = Completer<void>();
  bool _hasJoined = false;

  Future<void> _waitForJoin() => _joined.future;

  @override
  void onMessage(String type, void Function(Object? payload) handler) {
    _messageHandlers[type] = handler;
    _pending.removeWhere((m) {
      if (m.type != type) return false;
      handler(m.payload);
      return true;
    });
  }

  @override
  void onLeave(void Function(int code) handler) => _leaveHandlers.add(handler);

  @override
  void onError(void Function(int code, String? message) handler) =>
      _errorHandlers.add(handler);

  @override
  void send(String type, [Object? payload]) {
    final frame = BytesBuilder()
      ..addByte(_Protocol.roomData)
      ..add(_encodeString(type));
    if (payload != null) frame.add(msgpack.serialize(payload));
    _channel.sink.add(frame.toBytes());
  }

  @override
  Future<void> leave() async {
    _channel.sink.add(Uint8List.fromList([_Protocol.leaveRoom]));
    await _sub.cancel();
    await _channel.sink.close();
  }

  void _onData(dynamic data) {
    final bytes = Uint8List.fromList(data as List<int>);
    if (bytes.isEmpty) return;
    switch (bytes[0]) {
      case _Protocol.joinRoom:
        _handleJoin(bytes);
      case _Protocol.roomData:
        _handleRoomData(bytes);
      case _Protocol.error:
        _handleError(bytes);
      case _Protocol.leaveRoom:
        _onDone();
    }
  }

  void _handleJoin(Uint8List bytes) {
    var offset = 1;
    final tokenLen = bytes[offset++];
    final token = utf8.decode(bytes.sublist(offset, offset += tokenLen));
    // serializerId vem em seguida, mas não usamos state — ignoramos o resto.
    reconnectionToken = '$_roomId:$token';
    _hasJoined = true;
    _channel.sink.add(Uint8List.fromList([_Protocol.joinRoom])); // ACK
    if (!_joined.isCompleted) _joined.complete();
  }

  void _handleRoomData(Uint8List bytes) {
    var offset = 1;
    final marker = bytes[offset];
    // event names são sempre fixstr (< 32 chars) — 0xa0..0xbf
    if (marker < 0xa0 || marker > 0xbf) return;
    final len = marker & 0x1f;
    offset++;
    final type = utf8.decode(bytes.sublist(offset, offset += len));
    final payload = offset < bytes.length
        ? normalizeMsgpackJson(msgpack.deserialize(bytes.sublist(offset)))
        : null;
    final handler = _messageHandlers[type];
    if (handler != null) {
      handler(payload);
    } else {
      _pending.add((type: type, payload: payload));
    }
  }

  void _handleError(Uint8List bytes) {
    // [11, <schema number>, <schema string>] — decodificação simples do string.
    _emitError(4000, utf8.decode(bytes.sublist(1).where((b) => b >= 0x20).toList()));
  }

  void _onDone([int? code]) {
    if (!_joined.isCompleted) {
      _joined.completeError(
        ColyseusException('conexão fechada antes de entrar na sala'),
      );
      return;
    }
    final leaveCode = code ?? _channel.closeCode ?? 1000;
    for (final h in _leaveHandlers) {
      h(leaveCode);
    }
  }

  void _emitError(int code, String? message) {
    for (final h in _errorHandlers) {
      h(code, message);
    }
  }

  /// Codifica `type` como msgpack fixstr (`[0xa0|len, ...utf8]`). Só cobre
  /// nomes < 32 bytes — todos os eventos do contrato são.
  static Uint8List _encodeString(String value) {
    final data = utf8.encode(value);
    assert(data.length < 0x20, 'nome de evento longo demais: $value');
    return Uint8List.fromList([0xa0 | data.length, ...data]);
  }

  bool get hasJoined => _hasJoined;
}
