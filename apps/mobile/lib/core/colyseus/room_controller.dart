import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../models/wire.dart';
import 'colyseus_client.dart';
import 'room_handle.dart';
import 'room_state.dart';

/// Cria o cliente de rede. Testes fazem `overrideWithValue` pra injetar um fake.
final colyseusClientProvider = Provider<ColyseusClient>(
  (ref) => ColyseusClient(serverBaseUrl),
);

/// Fonte única do estado da sala. Espelha o `RoomStore` (signals) da web:
/// conecta via [ColyseusClient], assina os eventos JSON e mantém o [RoomState].
class RoomController extends Notifier<RoomState> {
  RoomHandle? _handle;
  String _reconnectToken = '';
  bool _disposed = false;

  static const _reconnectAttempts = 20;
  static const _reconnectDelay = Duration(seconds: 3);

  @override
  RoomState build() {
    ref.onDispose(() {
      _disposed = true;
      _handle?.leave();
    });
    return const RoomState();
  }

  ColyseusClient get _colyseus => ref.read(colyseusClientProvider);

  Future<void> create(String nickname) =>
      _connect(() => _colyseus.create(nickname));

  Future<void> join(String code, String nickname) =>
      _connect(() => _colyseus.join(code, nickname));

  Future<void> _connect(Future<RoomHandle> Function() open) async {
    state = state.copyWith(connecting: true, error: null);
    try {
      _bind(await open());
    } on Object catch (e) {
      if (_disposed) return;
      state = state.copyWith(connecting: false, error: _describe(e));
    }
  }

  void _bind(RoomHandle handle) {
    if (_disposed) return;
    _handle = handle;
    _reconnectToken = handle.reconnectionToken;
    state = state.copyWith(
      connecting: false,
      connected: true,
      reconnecting: false,
      mySessionId: handle.sessionId,
    );

    handle.onMessage(ServerEvents.lobbyState, (payload) {
      if (_disposed) return;
      final s = LobbyStatePayload.fromJson(_asMap(payload));
      state = state.copyWith(
        code: s.code,
        phase: s.phase,
        hostId: s.hostId,
        activeGameId: s.activeGameId,
        pendingGameId: s.pendingGameId,
        players: s.players,
        gameState: s.phase == RoomPhase.playing ? state.gameState : null,
        results: s.phase == RoomPhase.lobby ? state.results : null,
      );
    });

    handle.onMessage(ServerEvents.gameState, (payload) {
      if (_disposed) return;
      state = state.copyWith(gameState: payload, results: null);
    });

    handle.onMessage(ServerEvents.gameOver, (payload) {
      if (_disposed) return;
      state = state.copyWith(gameState: null, results: _asMap(payload));
    });

    handle.onMessage(ServerEvents.startGameError, (payload) {
      if (_disposed) return;
      state = state.copyWith(error: _asMap(payload)['message']?.toString());
    });

    handle.onLeave((code) {
      if (_disposed) return;
      state = state.copyWith(connected: false);
      if (code == 1000 || _reconnectToken.isEmpty) {
        _reset();
      } else {
        unawaited(_attemptReconnect());
      }
    });

    handle.onError((code, message) {
      if (_disposed) return;
      state = state.copyWith(error: message ?? 'Erro de conexão com a sala.');
    });
  }

  Future<void> _attemptReconnect() async {
    if (state.reconnecting) return;
    state = state.copyWith(reconnecting: true);
    final token = _reconnectToken;

    for (var i = 0; i < _reconnectAttempts && !_disposed && state.reconnecting; i++) {
      try {
        _bind(await _colyseus.reconnect(token));
        return;
      } on Object catch (_) {
        await Future<void>.delayed(_reconnectDelay);
      }
    }
    if (_disposed) return;
    state = state.copyWith(error: 'Você perdeu a conexão com a sala.');
    _reset();
  }

  void selectGame(String gameId, [Object? options]) => _handle?.send(
        ClientEvents.selectGame,
        {'gameId': gameId, 'options': ?options},
      );

  void toggleReady() => _handle?.send(ClientEvents.toggleReady);

  void cancelStart() => _handle?.send(ClientEvents.cancelStart);

  void sendAction(Object action) => _handle?.send(ClientEvents.gameAction, action);

  void clearError() => state = state.copyWith(error: null);

  void dismissResults() => state = state.copyWith(results: null);

  Future<void> leave() async {
    final handle = _handle;
    _handle = null;
    await handle?.leave();
    if (!_disposed) _reset();
  }

  void _reset() {
    _handle = null;
    _reconnectToken = '';
    state = const RoomState();
  }

  static Map<String, dynamic> _asMap(Object? raw) => raw is Map
      ? raw.map((k, v) => MapEntry(k.toString(), v))
      : <String, dynamic>{};

  static String _describe(Object e) => e is ColyseusException
      ? (e.code == 4212 ? 'Sala não encontrada.' : e.message)
      : 'Não foi possível conectar ao servidor.';
}

final roomControllerProvider =
    NotifierProvider<RoomController, RoomState>(RoomController.new);
