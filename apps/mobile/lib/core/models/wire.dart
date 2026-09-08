import 'package:freezed_annotation/freezed_annotation.dart';

part 'wire.freezed.dart';
part 'wire.g.dart';

/// Contrato do protocolo com o servidor. Espelho manual de
/// `packages/protocol/src/events.ts` + `docs/contrato-wire.md`. Se mudar lá,
/// muda aqui na mesma leva.

/// Fase da sala — decide qual tela o cliente mostra.
enum RoomPhase {
  @JsonValue('lobby')
  lobby,
  @JsonValue('starting')
  starting,
  @JsonValue('playing')
  playing,
}

/// Nomes de evento (`snake_case`, CLAUDE.md §6).
abstract final class ClientEvents {
  static const selectGame = 'select_game';
  static const toggleReady = 'toggle_ready';
  static const cancelStart = 'cancel_start';
  static const gameAction = 'game_action';
}

abstract final class ServerEvents {
  static const lobbyState = 'lobby_state';
  static const gameState = 'game_state';
  static const gameOver = 'game_over';
  static const startGameError = 'start_game_error';
}

@freezed
abstract class LobbyPlayer with _$LobbyPlayer {
  const factory LobbyPlayer({
    required String id,
    required String nickname,
    required bool connected,
    required bool ready,
  }) = _LobbyPlayer;

  factory LobbyPlayer.fromJson(Map<String, dynamic> json) =>
      _$LobbyPlayerFromJson(json);
}

/// Estado da sala, mandado inteiro a cada mudança (evento `lobby_state`).
@freezed
abstract class LobbyStatePayload with _$LobbyStatePayload {
  const factory LobbyStatePayload({
    required String code,
    required RoomPhase phase,
    required String hostId,
    @Default('') String activeGameId,
    @Default('') String pendingGameId,
    @Default([]) List<LobbyPlayer> players,
  }) = _LobbyStatePayload;

  factory LobbyStatePayload.fromJson(Map<String, dynamic> json) =>
      _$LobbyStatePayloadFromJson(json);
}
