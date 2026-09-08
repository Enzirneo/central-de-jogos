import 'package:central_de_jogos/core/colyseus/msgpack_json.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('converte Map/List dinâmicos aninhados (formato do msgpack_dart)', () {
    // O que msgpack_dart devolve: chaves e maps aninhados são dynamic.
    final raw = <dynamic, dynamic>{
      'code': 'ABCD',
      'phase': 'lobby',
      'hostId': 'p1',
      'activeGameId': '',
      'pendingGameId': '',
      'players': <dynamic>[
        <dynamic, dynamic>{
          'id': 'p1',
          'nickname': 'Ana',
          'connected': true,
          'ready': false,
        },
      ],
    };

    final clean = normalizeMsgpackJson(raw)! as Map<String, dynamic>;

    // sem o normalize, esta linha estoura com cast error na lista de players
    final lobby = LobbyStatePayload.fromJson(clean);
    expect(lobby.code, 'ABCD');
    expect(lobby.players.single.nickname, 'Ana');
  });

  test('deixa valores primitivos intactos', () {
    expect(normalizeMsgpackJson(42), 42);
    expect(normalizeMsgpackJson('x'), 'x');
    expect(normalizeMsgpackJson(null), isNull);
  });
}
