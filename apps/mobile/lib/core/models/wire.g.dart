// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wire.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LobbyPlayer _$LobbyPlayerFromJson(Map<String, dynamic> json) => _LobbyPlayer(
  id: json['id'] as String,
  nickname: json['nickname'] as String,
  connected: json['connected'] as bool,
  ready: json['ready'] as bool,
);

Map<String, dynamic> _$LobbyPlayerToJson(_LobbyPlayer instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nickname': instance.nickname,
      'connected': instance.connected,
      'ready': instance.ready,
    };

_LobbyStatePayload _$LobbyStatePayloadFromJson(Map<String, dynamic> json) =>
    _LobbyStatePayload(
      code: json['code'] as String,
      phase: $enumDecode(_$RoomPhaseEnumMap, json['phase']),
      hostId: json['hostId'] as String,
      activeGameId: json['activeGameId'] as String? ?? '',
      pendingGameId: json['pendingGameId'] as String? ?? '',
      pendingGameOptions: json['pendingGameOptions'],
      players:
          (json['players'] as List<dynamic>?)
              ?.map((e) => LobbyPlayer.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$LobbyStatePayloadToJson(_LobbyStatePayload instance) =>
    <String, dynamic>{
      'code': instance.code,
      'phase': _$RoomPhaseEnumMap[instance.phase]!,
      'hostId': instance.hostId,
      'activeGameId': instance.activeGameId,
      'pendingGameId': instance.pendingGameId,
      'pendingGameOptions': instance.pendingGameOptions,
      'players': instance.players,
    };

const _$RoomPhaseEnumMap = {
  RoomPhase.lobby: 'lobby',
  RoomPhase.starting: 'starting',
  RoomPhase.playing: 'playing',
};
