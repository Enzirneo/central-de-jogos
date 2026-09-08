import type { Server } from "@colyseus/core";
import { EchoRoom } from "./rooms/EchoRoom";
import { LobbyRoom } from "./rooms/LobbyRoom";

/**
 * Registra as salas no servidor. Fica separado do `index.ts` para o
 * `@colyseus/testing` poder subir um servidor de teste com as mesmas salas,
 * sem o boot de Postgres/Redis/HTTP.
 */
export function defineRooms(gameServer: Server): void {
  gameServer.define("echo", EchoRoom);
  gameServer.define("lobby", LobbyRoom).filterBy(["code"]);
}
