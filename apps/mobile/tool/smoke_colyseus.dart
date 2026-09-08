// Verificação manual do transporte contra um servidor rodando em localhost.
// NÃO é teste automatizado (precisa de rede + servidor). Rodar:
//   (na raiz) npm run dev  # sobe o servidor
//   dart run tool/smoke_colyseus.dart
// ignore_for_file: avoid_print
import 'package:central_de_jogos/core/colyseus/colyseus_client.dart';
import 'package:central_de_jogos/core/models/wire.dart';
import 'package:central_de_jogos/features/games/ito/ito_types.dart';

Future<void> main() async {
  final client = ColyseusClient('http://localhost:2567');

  final host = await client.create('Ana');
  LobbyStatePayload? hostLobby;
  host.onMessage(ServerEvents.lobbyState,
      (p) => hostLobby = LobbyStatePayload.fromJson(p! as Map<String, dynamic>));
  await Future<void>.delayed(const Duration(milliseconds: 300));
  print('sala criada, código: ${hostLobby?.code}  (sessionId=${host.sessionId})');
  print('reconnectionToken: ${host.reconnectionToken}');

  final guest = await client.join(hostLobby!.code, 'Beto');
  LobbyStatePayload? lastLobby;
  guest.onMessage(ServerEvents.lobbyState,
      (p) => lastLobby = LobbyStatePayload.fromJson(p! as Map<String, dynamic>));
  await Future<void>.delayed(const Duration(milliseconds: 300));
  print('guest entrou. jogadores: '
      '${lastLobby?.players.map((p) => p.nickname).toList()}');

  Map? over;
  guest.onMessage(ServerEvents.gameOver, (p) => over = p as Map?);
  Map? gs;
  host.onMessage(ServerEvents.gameState, (p) => gs = p as Map?);

  host.send(ClientEvents.selectGame, {'gameId': '_template'});
  await Future<void>.delayed(const Duration(milliseconds: 200));
  host.send('toggle_ready');
  guest.send('toggle_ready');
  await Future<void>.delayed(const Duration(milliseconds: 400));
  print('fase: ${lastLobby?.phase}  gameState inicial: $gs');

  for (var i = 0; i < 6; i++) {
    host.send('game_action', {'type': 'increment'});
    guest.send('game_action', {'type': 'increment'});
    await Future<void>.delayed(const Duration(milliseconds: 60));
  }
  await Future<void>.delayed(const Duration(milliseconds: 300));
  print('game_over: $over');

  // --- ITO: 3 jogadores, 2 rodadas, parseando com ItoView ---
  final third = await client.join(lastLobby!.code, 'Cléo');
  ItoView? ito;
  host.onMessage(ServerEvents.gameState,
      (p) => ito = ItoView((p! as Map).cast<String, dynamic>()));
  await Future<void>.delayed(const Duration(milliseconds: 200));
  host.send(ClientEvents.selectGame, {
    'gameId': 'ito',
    'options': {'mode': 'consensus', 'rounds': {'type': 'fixed', 'totalRounds': 2}},
  });
  await Future<void>.delayed(const Duration(milliseconds: 200));
  for (final r in [host, guest, third]) {
    r.send('toggle_ready');
  }
  await Future<void>.delayed(const Duration(milliseconds: 400));
  print('ITO ${ito?.phase}  meu nº ${ito?.myNumber}  tema "${ito?.theme}"');
  for (final r in [host, guest, third]) {
    r.send('game_action', {'type': 'submit_clue', 'clue': 'x'});
  }
  await Future<void>.delayed(const Duration(milliseconds: 400));
  print('ITO ${ito?.phase}  board ${ito?.board.length}  '
      'dicas ${ito?.cards.values.where((c) => c.hasSubmittedClue).length}');
  for (final r in [host, guest, third]) {
    r.send('game_action', {'type': 'ready_to_reveal'});
  }
  await Future<void>.delayed(const Duration(milliseconds: 400));
  print('ITO ${ito?.phase}  ordem certa ${ito?.lastRoundResult?.correctOrder.length}  '
      'nºs ${ito?.cards.values.map((c) => c.number).toList()}');

  await host.leave();
  await guest.leave();
  await third.leave();
  client.close();
  print('OK');
}
