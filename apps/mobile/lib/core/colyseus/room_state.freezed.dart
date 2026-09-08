// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'room_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$RoomState {

 bool get connecting; bool get connected; bool get reconnecting; String? get error; String get code; RoomPhase get phase; String get hostId; String get activeGameId; String get pendingGameId; Object? get pendingGameOptions; List<LobbyPlayer> get players; Object? get gameState; Map<String, dynamic>? get results; String get mySessionId;
/// Create a copy of RoomState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RoomStateCopyWith<RoomState> get copyWith => _$RoomStateCopyWithImpl<RoomState>(this as RoomState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as RoomState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RoomState&&(identical(other.connecting, _this.connecting) || other.connecting == _this.connecting)&&(identical(other.connected, _this.connected) || other.connected == _this.connected)&&(identical(other.reconnecting, _this.reconnecting) || other.reconnecting == _this.reconnecting)&&(identical(other.error, _this.error) || other.error == _this.error)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.phase, _this.phase) || other.phase == _this.phase)&&(identical(other.hostId, _this.hostId) || other.hostId == _this.hostId)&&(identical(other.activeGameId, _this.activeGameId) || other.activeGameId == _this.activeGameId)&&(identical(other.pendingGameId, _this.pendingGameId) || other.pendingGameId == _this.pendingGameId)&&const DeepCollectionEquality().equals(other.pendingGameOptions, _this.pendingGameOptions)&&const DeepCollectionEquality().equals(other.players, _this.players)&&const DeepCollectionEquality().equals(other.gameState, _this.gameState)&&const DeepCollectionEquality().equals(other.results, _this.results)&&(identical(other.mySessionId, _this.mySessionId) || other.mySessionId == _this.mySessionId));
}


@override
int get hashCode {
  final _this = this as RoomState;
  return Object.hash(runtimeType,_this.connecting,_this.connected,_this.reconnecting,_this.error,_this.code,_this.phase,_this.hostId,_this.activeGameId,_this.pendingGameId,const DeepCollectionEquality().hash(_this.pendingGameOptions),const DeepCollectionEquality().hash(_this.players),const DeepCollectionEquality().hash(_this.gameState),const DeepCollectionEquality().hash(_this.results),_this.mySessionId);
}

@override
String toString() {
  final _this = this as RoomState;
  return 'RoomState(connecting: ${_this.connecting}, connected: ${_this.connected}, reconnecting: ${_this.reconnecting}, error: ${_this.error}, code: ${_this.code}, phase: ${_this.phase}, hostId: ${_this.hostId}, activeGameId: ${_this.activeGameId}, pendingGameId: ${_this.pendingGameId}, pendingGameOptions: ${_this.pendingGameOptions}, players: ${_this.players}, gameState: ${_this.gameState}, results: ${_this.results}, mySessionId: ${_this.mySessionId})';
}


}

/// @nodoc
abstract mixin class $RoomStateCopyWith<$Res>  {
  factory $RoomStateCopyWith(RoomState value, $Res Function(RoomState) _then) = _$RoomStateCopyWithImpl;
@useResult
$Res call({
 bool connecting, bool connected, bool reconnecting, String? error, String code, RoomPhase phase, String hostId, String activeGameId, String pendingGameId, Object? pendingGameOptions, List<LobbyPlayer> players, Object? gameState, Map<String, dynamic>? results, String mySessionId
});




}
/// @nodoc
class _$RoomStateCopyWithImpl<$Res>
    implements $RoomStateCopyWith<$Res> {
  _$RoomStateCopyWithImpl(this._self, this._then);

  final RoomState _self;
  final $Res Function(RoomState) _then;

/// Create a copy of RoomState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? connecting = null,Object? connected = null,Object? reconnecting = null,Object? error = freezed,Object? code = null,Object? phase = null,Object? hostId = null,Object? activeGameId = null,Object? pendingGameId = null,Object? pendingGameOptions = freezed,Object? players = null,Object? gameState = freezed,Object? results = freezed,Object? mySessionId = null,}) {
  return _then(RoomState(
connecting: null == connecting ? _self.connecting : connecting // ignore: cast_nullable_to_non_nullable
as bool,connected: null == connected ? _self.connected : connected // ignore: cast_nullable_to_non_nullable
as bool,reconnecting: null == reconnecting ? _self.reconnecting : reconnecting // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,phase: null == phase ? _self.phase : phase // ignore: cast_nullable_to_non_nullable
as RoomPhase,hostId: null == hostId ? _self.hostId : hostId // ignore: cast_nullable_to_non_nullable
as String,activeGameId: null == activeGameId ? _self.activeGameId : activeGameId // ignore: cast_nullable_to_non_nullable
as String,pendingGameId: null == pendingGameId ? _self.pendingGameId : pendingGameId // ignore: cast_nullable_to_non_nullable
as String,pendingGameOptions: freezed == pendingGameOptions ? _self.pendingGameOptions : pendingGameOptions ,players: null == players ? _self.players : players // ignore: cast_nullable_to_non_nullable
as List<LobbyPlayer>,gameState: freezed == gameState ? _self.gameState : gameState ,results: freezed == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,mySessionId: null == mySessionId ? _self.mySessionId : mySessionId // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [RoomState].
extension RoomStatePatterns on RoomState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RoomState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RoomState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RoomState value)  $default,){
final _that = this;
switch (_that) {
case _RoomState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RoomState value)?  $default,){
final _that = this;
switch (_that) {
case _RoomState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool connecting,  bool connected,  bool reconnecting,  String? error,  String code,  RoomPhase phase,  String hostId,  String activeGameId,  String pendingGameId,  Object? pendingGameOptions,  List<LobbyPlayer> players,  Object? gameState,  Map<String, dynamic>? results,  String mySessionId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RoomState() when $default != null:
return $default(_that.connecting,_that.connected,_that.reconnecting,_that.error,_that.code,_that.phase,_that.hostId,_that.activeGameId,_that.pendingGameId,_that.pendingGameOptions,_that.players,_that.gameState,_that.results,_that.mySessionId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool connecting,  bool connected,  bool reconnecting,  String? error,  String code,  RoomPhase phase,  String hostId,  String activeGameId,  String pendingGameId,  Object? pendingGameOptions,  List<LobbyPlayer> players,  Object? gameState,  Map<String, dynamic>? results,  String mySessionId)  $default,) {final _that = this;
switch (_that) {
case _RoomState():
return $default(_that.connecting,_that.connected,_that.reconnecting,_that.error,_that.code,_that.phase,_that.hostId,_that.activeGameId,_that.pendingGameId,_that.pendingGameOptions,_that.players,_that.gameState,_that.results,_that.mySessionId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool connecting,  bool connected,  bool reconnecting,  String? error,  String code,  RoomPhase phase,  String hostId,  String activeGameId,  String pendingGameId,  Object? pendingGameOptions,  List<LobbyPlayer> players,  Object? gameState,  Map<String, dynamic>? results,  String mySessionId)?  $default,) {final _that = this;
switch (_that) {
case _RoomState() when $default != null:
return $default(_that.connecting,_that.connected,_that.reconnecting,_that.error,_that.code,_that.phase,_that.hostId,_that.activeGameId,_that.pendingGameId,_that.pendingGameOptions,_that.players,_that.gameState,_that.results,_that.mySessionId);case _:
  return null;

}
}

}

/// @nodoc


class _RoomState extends RoomState {
  const _RoomState({this.connecting = false, this.connected = false, this.reconnecting = false, this.error, this.code = '', this.phase = RoomPhase.lobby, this.hostId = '', this.activeGameId = '', this.pendingGameId = '', this.pendingGameOptions,  List<LobbyPlayer> players = const <LobbyPlayer>[], this.gameState,  Map<String, dynamic>? results, this.mySessionId = ''}): _players = players,_results = results,super._();
  

@override@JsonKey() final  bool connecting;
@override@JsonKey() final  bool connected;
@override@JsonKey() final  bool reconnecting;
@override final  String? error;
@override@JsonKey() final  String code;
@override@JsonKey() final  RoomPhase phase;
@override@JsonKey() final  String hostId;
@override@JsonKey() final  String activeGameId;
@override@JsonKey() final  String pendingGameId;
@override final  Object? pendingGameOptions;
 final  List<LobbyPlayer> _players;
@override@JsonKey() List<LobbyPlayer> get players {
  if (_players is EqualUnmodifiableListView) return _players;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_players);
}

@override final  Object? gameState;
 final  Map<String, dynamic>? _results;
@override Map<String, dynamic>? get results {
  final value = _results;
  if (value == null) return null;
  if (_results is EqualUnmodifiableMapView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override@JsonKey() final  String mySessionId;

/// Create a copy of RoomState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RoomStateCopyWith<_RoomState> get copyWith => __$RoomStateCopyWithImpl<_RoomState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RoomState&&(identical(other.connecting, connecting) || other.connecting == connecting)&&(identical(other.connected, connected) || other.connected == connected)&&(identical(other.reconnecting, reconnecting) || other.reconnecting == reconnecting)&&(identical(other.error, error) || other.error == error)&&(identical(other.code, code) || other.code == code)&&(identical(other.phase, phase) || other.phase == phase)&&(identical(other.hostId, hostId) || other.hostId == hostId)&&(identical(other.activeGameId, activeGameId) || other.activeGameId == activeGameId)&&(identical(other.pendingGameId, pendingGameId) || other.pendingGameId == pendingGameId)&&const DeepCollectionEquality().equals(other.pendingGameOptions, pendingGameOptions)&&const DeepCollectionEquality().equals(other.players, _players)&&const DeepCollectionEquality().equals(other.gameState, gameState)&&const DeepCollectionEquality().equals(other.results, _results)&&(identical(other.mySessionId, mySessionId) || other.mySessionId == mySessionId));
}


@override
int get hashCode {
    return Object.hash(runtimeType,connecting,connected,reconnecting,error,code,phase,hostId,activeGameId,pendingGameId,const DeepCollectionEquality().hash(pendingGameOptions),const DeepCollectionEquality().hash(_players),const DeepCollectionEquality().hash(gameState),const DeepCollectionEquality().hash(_results),mySessionId);
}

@override
String toString() {
    return 'RoomState(connecting: $connecting, connected: $connected, reconnecting: $reconnecting, error: $error, code: $code, phase: $phase, hostId: $hostId, activeGameId: $activeGameId, pendingGameId: $pendingGameId, pendingGameOptions: $pendingGameOptions, players: $players, gameState: $gameState, results: $results, mySessionId: $mySessionId)';
}


}

/// @nodoc
abstract mixin class _$RoomStateCopyWith<$Res> implements $RoomStateCopyWith<$Res> {
  factory _$RoomStateCopyWith(_RoomState value, $Res Function(_RoomState) _then) = __$RoomStateCopyWithImpl;
@override @useResult
$Res call({
 bool connecting, bool connected, bool reconnecting, String? error, String code, RoomPhase phase, String hostId, String activeGameId, String pendingGameId, Object? pendingGameOptions, List<LobbyPlayer> players, Object? gameState, Map<String, dynamic>? results, String mySessionId
});




}
/// @nodoc
class __$RoomStateCopyWithImpl<$Res>
    implements _$RoomStateCopyWith<$Res> {
  __$RoomStateCopyWithImpl(this._self, this._then);

  final _RoomState _self;
  final $Res Function(_RoomState) _then;

/// Create a copy of RoomState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? connecting = null,Object? connected = null,Object? reconnecting = null,Object? error = freezed,Object? code = null,Object? phase = null,Object? hostId = null,Object? activeGameId = null,Object? pendingGameId = null,Object? pendingGameOptions = freezed,Object? players = null,Object? gameState = freezed,Object? results = freezed,Object? mySessionId = null,}) {
  return _then(_RoomState(
connecting: null == connecting ? _self.connecting : connecting // ignore: cast_nullable_to_non_nullable
as bool,connected: null == connected ? _self.connected : connected // ignore: cast_nullable_to_non_nullable
as bool,reconnecting: null == reconnecting ? _self.reconnecting : reconnecting // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,phase: null == phase ? _self.phase : phase // ignore: cast_nullable_to_non_nullable
as RoomPhase,hostId: null == hostId ? _self.hostId : hostId // ignore: cast_nullable_to_non_nullable
as String,activeGameId: null == activeGameId ? _self.activeGameId : activeGameId // ignore: cast_nullable_to_non_nullable
as String,pendingGameId: null == pendingGameId ? _self.pendingGameId : pendingGameId // ignore: cast_nullable_to_non_nullable
as String,pendingGameOptions: freezed == pendingGameOptions ? _self.pendingGameOptions : pendingGameOptions ,players: null == players ? _self._players : players // ignore: cast_nullable_to_non_nullable
as List<LobbyPlayer>,gameState: freezed == gameState ? _self.gameState : gameState ,results: freezed == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,mySessionId: null == mySessionId ? _self.mySessionId : mySessionId // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
