// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'wire.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$LobbyPlayer {

 String get id; String get nickname; bool get connected; bool get ready;
/// Create a copy of LobbyPlayer
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LobbyPlayerCopyWith<LobbyPlayer> get copyWith => _$LobbyPlayerCopyWithImpl<LobbyPlayer>(this as LobbyPlayer, _$identity);

  /// Serializes this LobbyPlayer to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LobbyPlayer;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LobbyPlayer&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.nickname, _this.nickname) || other.nickname == _this.nickname)&&(identical(other.connected, _this.connected) || other.connected == _this.connected)&&(identical(other.ready, _this.ready) || other.ready == _this.ready));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LobbyPlayer;
  return Object.hash(runtimeType,_this.id,_this.nickname,_this.connected,_this.ready);
}

@override
String toString() {
  final _this = this as LobbyPlayer;
  return 'LobbyPlayer(id: ${_this.id}, nickname: ${_this.nickname}, connected: ${_this.connected}, ready: ${_this.ready})';
}


}

/// @nodoc
abstract mixin class $LobbyPlayerCopyWith<$Res>  {
  factory $LobbyPlayerCopyWith(LobbyPlayer value, $Res Function(LobbyPlayer) _then) = _$LobbyPlayerCopyWithImpl;
@useResult
$Res call({
 String id, String nickname, bool connected, bool ready
});




}
/// @nodoc
class _$LobbyPlayerCopyWithImpl<$Res>
    implements $LobbyPlayerCopyWith<$Res> {
  _$LobbyPlayerCopyWithImpl(this._self, this._then);

  final LobbyPlayer _self;
  final $Res Function(LobbyPlayer) _then;

/// Create a copy of LobbyPlayer
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? nickname = null,Object? connected = null,Object? ready = null,}) {
  return _then(LobbyPlayer(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,nickname: null == nickname ? _self.nickname : nickname // ignore: cast_nullable_to_non_nullable
as String,connected: null == connected ? _self.connected : connected // ignore: cast_nullable_to_non_nullable
as bool,ready: null == ready ? _self.ready : ready // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [LobbyPlayer].
extension LobbyPlayerPatterns on LobbyPlayer {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LobbyPlayer value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LobbyPlayer() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LobbyPlayer value)  $default,){
final _that = this;
switch (_that) {
case _LobbyPlayer():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LobbyPlayer value)?  $default,){
final _that = this;
switch (_that) {
case _LobbyPlayer() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String nickname,  bool connected,  bool ready)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LobbyPlayer() when $default != null:
return $default(_that.id,_that.nickname,_that.connected,_that.ready);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String nickname,  bool connected,  bool ready)  $default,) {final _that = this;
switch (_that) {
case _LobbyPlayer():
return $default(_that.id,_that.nickname,_that.connected,_that.ready);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String nickname,  bool connected,  bool ready)?  $default,) {final _that = this;
switch (_that) {
case _LobbyPlayer() when $default != null:
return $default(_that.id,_that.nickname,_that.connected,_that.ready);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LobbyPlayer implements LobbyPlayer {
  const _LobbyPlayer({required this.id, required this.nickname, required this.connected, required this.ready});
  factory _LobbyPlayer.fromJson(Map<String, dynamic> json) => _$LobbyPlayerFromJson(json);

@override final  String id;
@override final  String nickname;
@override final  bool connected;
@override final  bool ready;

/// Create a copy of LobbyPlayer
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LobbyPlayerCopyWith<_LobbyPlayer> get copyWith => __$LobbyPlayerCopyWithImpl<_LobbyPlayer>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LobbyPlayerToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LobbyPlayer&&(identical(other.id, id) || other.id == id)&&(identical(other.nickname, nickname) || other.nickname == nickname)&&(identical(other.connected, connected) || other.connected == connected)&&(identical(other.ready, ready) || other.ready == ready));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,nickname,connected,ready);
}

@override
String toString() {
    return 'LobbyPlayer(id: $id, nickname: $nickname, connected: $connected, ready: $ready)';
}


}

/// @nodoc
abstract mixin class _$LobbyPlayerCopyWith<$Res> implements $LobbyPlayerCopyWith<$Res> {
  factory _$LobbyPlayerCopyWith(_LobbyPlayer value, $Res Function(_LobbyPlayer) _then) = __$LobbyPlayerCopyWithImpl;
@override @useResult
$Res call({
 String id, String nickname, bool connected, bool ready
});




}
/// @nodoc
class __$LobbyPlayerCopyWithImpl<$Res>
    implements _$LobbyPlayerCopyWith<$Res> {
  __$LobbyPlayerCopyWithImpl(this._self, this._then);

  final _LobbyPlayer _self;
  final $Res Function(_LobbyPlayer) _then;

/// Create a copy of LobbyPlayer
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? nickname = null,Object? connected = null,Object? ready = null,}) {
  return _then(_LobbyPlayer(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,nickname: null == nickname ? _self.nickname : nickname // ignore: cast_nullable_to_non_nullable
as String,connected: null == connected ? _self.connected : connected // ignore: cast_nullable_to_non_nullable
as bool,ready: null == ready ? _self.ready : ready // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$LobbyStatePayload {

 String get code; RoomPhase get phase; String get hostId; String get activeGameId; String get pendingGameId; List<LobbyPlayer> get players;
/// Create a copy of LobbyStatePayload
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LobbyStatePayloadCopyWith<LobbyStatePayload> get copyWith => _$LobbyStatePayloadCopyWithImpl<LobbyStatePayload>(this as LobbyStatePayload, _$identity);

  /// Serializes this LobbyStatePayload to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LobbyStatePayload;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LobbyStatePayload&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.phase, _this.phase) || other.phase == _this.phase)&&(identical(other.hostId, _this.hostId) || other.hostId == _this.hostId)&&(identical(other.activeGameId, _this.activeGameId) || other.activeGameId == _this.activeGameId)&&(identical(other.pendingGameId, _this.pendingGameId) || other.pendingGameId == _this.pendingGameId)&&const DeepCollectionEquality().equals(other.players, _this.players));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LobbyStatePayload;
  return Object.hash(runtimeType,_this.code,_this.phase,_this.hostId,_this.activeGameId,_this.pendingGameId,const DeepCollectionEquality().hash(_this.players));
}

@override
String toString() {
  final _this = this as LobbyStatePayload;
  return 'LobbyStatePayload(code: ${_this.code}, phase: ${_this.phase}, hostId: ${_this.hostId}, activeGameId: ${_this.activeGameId}, pendingGameId: ${_this.pendingGameId}, players: ${_this.players})';
}


}

/// @nodoc
abstract mixin class $LobbyStatePayloadCopyWith<$Res>  {
  factory $LobbyStatePayloadCopyWith(LobbyStatePayload value, $Res Function(LobbyStatePayload) _then) = _$LobbyStatePayloadCopyWithImpl;
@useResult
$Res call({
 String code, RoomPhase phase, String hostId, String activeGameId, String pendingGameId, List<LobbyPlayer> players
});




}
/// @nodoc
class _$LobbyStatePayloadCopyWithImpl<$Res>
    implements $LobbyStatePayloadCopyWith<$Res> {
  _$LobbyStatePayloadCopyWithImpl(this._self, this._then);

  final LobbyStatePayload _self;
  final $Res Function(LobbyStatePayload) _then;

/// Create a copy of LobbyStatePayload
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? code = null,Object? phase = null,Object? hostId = null,Object? activeGameId = null,Object? pendingGameId = null,Object? players = null,}) {
  return _then(LobbyStatePayload(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,phase: null == phase ? _self.phase : phase // ignore: cast_nullable_to_non_nullable
as RoomPhase,hostId: null == hostId ? _self.hostId : hostId // ignore: cast_nullable_to_non_nullable
as String,activeGameId: null == activeGameId ? _self.activeGameId : activeGameId // ignore: cast_nullable_to_non_nullable
as String,pendingGameId: null == pendingGameId ? _self.pendingGameId : pendingGameId // ignore: cast_nullable_to_non_nullable
as String,players: null == players ? _self.players : players // ignore: cast_nullable_to_non_nullable
as List<LobbyPlayer>,
  ));
}

}


/// Adds pattern-matching-related methods to [LobbyStatePayload].
extension LobbyStatePayloadPatterns on LobbyStatePayload {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LobbyStatePayload value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LobbyStatePayload() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LobbyStatePayload value)  $default,){
final _that = this;
switch (_that) {
case _LobbyStatePayload():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LobbyStatePayload value)?  $default,){
final _that = this;
switch (_that) {
case _LobbyStatePayload() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String code,  RoomPhase phase,  String hostId,  String activeGameId,  String pendingGameId,  List<LobbyPlayer> players)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LobbyStatePayload() when $default != null:
return $default(_that.code,_that.phase,_that.hostId,_that.activeGameId,_that.pendingGameId,_that.players);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String code,  RoomPhase phase,  String hostId,  String activeGameId,  String pendingGameId,  List<LobbyPlayer> players)  $default,) {final _that = this;
switch (_that) {
case _LobbyStatePayload():
return $default(_that.code,_that.phase,_that.hostId,_that.activeGameId,_that.pendingGameId,_that.players);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String code,  RoomPhase phase,  String hostId,  String activeGameId,  String pendingGameId,  List<LobbyPlayer> players)?  $default,) {final _that = this;
switch (_that) {
case _LobbyStatePayload() when $default != null:
return $default(_that.code,_that.phase,_that.hostId,_that.activeGameId,_that.pendingGameId,_that.players);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LobbyStatePayload implements LobbyStatePayload {
  const _LobbyStatePayload({required this.code, required this.phase, required this.hostId, this.activeGameId = '', this.pendingGameId = '',  List<LobbyPlayer> players = const []}): _players = players;
  factory _LobbyStatePayload.fromJson(Map<String, dynamic> json) => _$LobbyStatePayloadFromJson(json);

@override final  String code;
@override final  RoomPhase phase;
@override final  String hostId;
@override@JsonKey() final  String activeGameId;
@override@JsonKey() final  String pendingGameId;
 final  List<LobbyPlayer> _players;
@override@JsonKey() List<LobbyPlayer> get players {
  if (_players is EqualUnmodifiableListView) return _players;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_players);
}


/// Create a copy of LobbyStatePayload
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LobbyStatePayloadCopyWith<_LobbyStatePayload> get copyWith => __$LobbyStatePayloadCopyWithImpl<_LobbyStatePayload>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LobbyStatePayloadToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LobbyStatePayload&&(identical(other.code, code) || other.code == code)&&(identical(other.phase, phase) || other.phase == phase)&&(identical(other.hostId, hostId) || other.hostId == hostId)&&(identical(other.activeGameId, activeGameId) || other.activeGameId == activeGameId)&&(identical(other.pendingGameId, pendingGameId) || other.pendingGameId == pendingGameId)&&const DeepCollectionEquality().equals(other.players, _players));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,code,phase,hostId,activeGameId,pendingGameId,const DeepCollectionEquality().hash(_players));
}

@override
String toString() {
    return 'LobbyStatePayload(code: $code, phase: $phase, hostId: $hostId, activeGameId: $activeGameId, pendingGameId: $pendingGameId, players: $players)';
}


}

/// @nodoc
abstract mixin class _$LobbyStatePayloadCopyWith<$Res> implements $LobbyStatePayloadCopyWith<$Res> {
  factory _$LobbyStatePayloadCopyWith(_LobbyStatePayload value, $Res Function(_LobbyStatePayload) _then) = __$LobbyStatePayloadCopyWithImpl;
@override @useResult
$Res call({
 String code, RoomPhase phase, String hostId, String activeGameId, String pendingGameId, List<LobbyPlayer> players
});




}
/// @nodoc
class __$LobbyStatePayloadCopyWithImpl<$Res>
    implements _$LobbyStatePayloadCopyWith<$Res> {
  __$LobbyStatePayloadCopyWithImpl(this._self, this._then);

  final _LobbyStatePayload _self;
  final $Res Function(_LobbyStatePayload) _then;

/// Create a copy of LobbyStatePayload
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? code = null,Object? phase = null,Object? hostId = null,Object? activeGameId = null,Object? pendingGameId = null,Object? players = null,}) {
  return _then(_LobbyStatePayload(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,phase: null == phase ? _self.phase : phase // ignore: cast_nullable_to_non_nullable
as RoomPhase,hostId: null == hostId ? _self.hostId : hostId // ignore: cast_nullable_to_non_nullable
as String,activeGameId: null == activeGameId ? _self.activeGameId : activeGameId // ignore: cast_nullable_to_non_nullable
as String,pendingGameId: null == pendingGameId ? _self.pendingGameId : pendingGameId // ignore: cast_nullable_to_non_nullable
as String,players: null == players ? _self._players : players // ignore: cast_nullable_to_non_nullable
as List<LobbyPlayer>,
  ));
}


}

// dart format on
