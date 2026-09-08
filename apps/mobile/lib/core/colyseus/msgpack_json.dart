/// `msgpack_dart` devolve `Map<dynamic, dynamic>` (e listas/maps aninhados
/// também). Converte recursivamente pra `Map<String, dynamic>` / `List<dynamic>`
/// pra os `fromJson` gerados (freezed) funcionarem nos objetos aninhados —
/// senão `players.map((e) => LobbyPlayer.fromJson(e as Map<String, dynamic>))`
/// estoura com cast error.
Object? normalizeMsgpackJson(Object? value) {
  if (value is Map) {
    return <String, dynamic>{
      for (final e in value.entries)
        e.key.toString(): normalizeMsgpackJson(e.value),
    };
  }
  if (value is List) {
    return <dynamic>[for (final e in value) normalizeMsgpackJson(e)];
  }
  return value;
}
