import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@central-de-jogos/protocol";
import { defineRooms } from "../app";

let colyseus: ColyseusTestServer;

before(async () => {
  colyseus = await boot({ initializeGameServer: defineRooms });
});
after(async () => {
  await colyseus.shutdown();
});
beforeEach(async () => {
  await colyseus.cleanup();
});

/**
 * Grava todas as mensagens do servidor para um cliente e permite esperar pela
 * próxima de um tipo (ou pela próxima que satisfaça um predicado). Evita corrida
 * entre registrar o listener e a mensagem chegar.
 */
function recorder(room: any) {
  const buffer: Array<{ type: string; payload: any }> = [];
  const waiters: Array<(m: { type: string; payload: any }) => void> = [];
  for (const type of Object.values(SERVER_EVENTS)) {
    room.onMessage(type, (payload: any) => {
      const msg = { type, payload };
      buffer.push(msg);
      for (const w of waiters.splice(0)) w(msg);
    });
  }
  return {
    async next(type: string, predicate?: (p: any) => boolean, timeoutMs = 2000) {
      const matches = (m: { type: string; payload: any }) =>
        m.type === type && (!predicate || predicate(m.payload));
      const existing = buffer.find(matches);
      if (existing) return existing.payload;
      return new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout esperando "${type}"`)), timeoutMs);
        const check = (m: { type: string; payload: any }) => {
          if (matches(m)) {
            clearTimeout(timer);
            resolve(m.payload);
          } else {
            waiters.push(check);
          }
        };
        waiters.push(check);
      });
    },
  };
}

test("fluxo completo: lobby → starting → playing → game_over → lobby", async () => {
  const room = await colyseus.createRoom<any>("lobby", {});
  const client = await colyseus.connectTo(room, { nickname: "Ana" });
  const rec = recorder(client);

  assert.equal(room.hostId, client.sessionId);
  assert.equal(room.players.size, 1);
  assert.equal((await rec.next(SERVER_EVENTS.LOBBY_STATE)).phase, "lobby");

  // host escolhe o jogo de teste (_template: min 1 jogador)
  client.send(CLIENT_EVENTS.SELECT_GAME, { gameId: "_template" });
  const starting = await rec.next(SERVER_EVENTS.LOBBY_STATE, (p) => p.phase === "starting");
  assert.equal(starting.pendingGameId, "_template");
  assert.equal(room.phase, "starting");

  // fica pronto → jogo começa
  client.send(CLIENT_EVENTS.TOGGLE_READY);
  const playing = await rec.next(SERVER_EVENTS.LOBBY_STATE, (p) => p.phase === "playing");
  assert.equal(playing.activeGameId, "_template");
  const firstGameState = await rec.next(SERVER_EVENTS.GAME_STATE);
  assert.equal(firstGameState.target, 5);

  // clica 5 vezes (TARGET_COUNT) → game_over
  for (let i = 0; i < 5; i++) {
    client.send(CLIENT_EVENTS.GAME_ACTION, { type: "increment" });
    if (i < 4) {
      await rec.next(SERVER_EVENTS.GAME_STATE, (p) => p.myCount === i + 1);
    }
  }

  const results = await rec.next(SERVER_EVENTS.GAME_OVER);
  assert.equal(results.target, 5);
  assert.equal(results.counters[client.sessionId], 5);

  // sala volta pro lobby
  const backToLobby = await rec.next(SERVER_EVENTS.LOBBY_STATE, (p) => p.phase === "lobby" && p.activeGameId === "");
  assert.equal(backToLobby.activeGameId, "");
  assert.equal(room.phase, "lobby");
});

test("select_game de quem não é host é recusado", async () => {
  const room = await colyseus.createRoom<any>("lobby", {});
  const host = await colyseus.connectTo(room, { nickname: "Host" });
  const outro = await colyseus.connectTo(room, { nickname: "Outro" });
  const rec = recorder(outro);
  assert.equal(room.hostId, host.sessionId);

  outro.send(CLIENT_EVENTS.SELECT_GAME, { gameId: "_template" });
  const err = await rec.next(SERVER_EVENTS.START_GAME_ERROR);
  assert.match(err.message, /host|criou a sala/i);
  assert.equal(room.phase, "lobby");
});

test("select_game com jogadores fora da faixa do jogo é recusado", async () => {
  const room = await colyseus.createRoom<any>("lobby", {});
  const host = await colyseus.connectTo(room, { nickname: "Host" });
  const rec = recorder(host);

  // ito precisa de 3 a 8 jogadores; só há 1
  host.send(CLIENT_EVENTS.SELECT_GAME, { gameId: "ito" });
  const err = await rec.next(SERVER_EVENTS.START_GAME_ERROR);
  assert.match(err.message, /3 a 8 jogadores/);
  assert.equal(room.phase, "lobby");
});

test("payload malformado de select_game vira start_game_error", async () => {
  const room = await colyseus.createRoom<any>("lobby", {});
  const host = await colyseus.connectTo(room, { nickname: "Host" });
  const rec = recorder(host);

  host.send(CLIENT_EVENTS.SELECT_GAME, { gameId: 123 });
  const err = await rec.next(SERVER_EVENTS.START_GAME_ERROR);
  assert.match(err.message, /inválida/i);
});
test("saída intencional remove o jogador e passa o host adiante", async () => {
  const room = await colyseus.createRoom<any>("lobby", {});
  const host = await colyseus.connectTo(room, { nickname: "Host" });
  const guest = await colyseus.connectTo(room, { nickname: "Guest" });
  const rec = recorder(guest);
  assert.equal(room.players.size, 2);
  assert.equal(room.hostId, host.sessionId);

  await host.leave(true); // saída intencional → remove na hora
  const afterLeave = await rec.next(
    SERVER_EVENTS.LOBBY_STATE,
    (p) => p.players.length === 1
  );
  assert.equal(afterLeave.hostId, guest.sessionId);
  assert.equal(room.hostId, guest.sessionId);
});

// A reconexão após queda não intencional (janela de 60s) é exercida
// manualmente / em teste dedicado com fake timers — um teste real aqui
// seguraria o processo pelos 60s do allowReconnection.
