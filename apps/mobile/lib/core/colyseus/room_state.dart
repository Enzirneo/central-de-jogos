import 'package:freezed_annotation/freezed_annotation.dart';

import '../models/wire.dart';

part 'room_state.freezed.dart';

/// Estado observável da sala. Espelha os signals do `RoomStore` da web.
/// `gameState` e `results` são opacos aqui — cada tela de jogo interpreta.
@freezed
abstract class RoomState with _$RoomState {
  const RoomState._();

  const factory RoomState({
    @Default(false) bool connecting,
    @Default(false) bool connected,
    @Default(false) bool reconnecting,
    String? error,
    @Default('') String code,
    @Default(RoomPhase.lobby) RoomPhase phase,
    @Default('') String hostId,
    @Default('') String activeGameId,
    @Default('') String pendingGameId,
    Object? pendingGameOptions,
    @Default(<LobbyPlayer>[]) List<LobbyPlayer> players,
    Object? gameState,
    Map<String, dynamic>? results,
    @Default('') String mySessionId,
  }) = _RoomState;

  bool get isHost => mySessionId.isNotEmpty && mySessionId == hostId;

  LobbyPlayer? get me {
    for (final p in players) {
      if (p.id == mySessionId) return p;
    }
    return null;
  }
}
