import "dotenv/config";
import http from "http";
import express from "express";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { EchoRoom } from "./rooms/EchoRoom";
import { LobbyRoom } from "./rooms/LobbyRoom";
import { checkPostgresConnection } from "./db";
import { checkRedisConnection } from "./redis";

const port = Number(process.env.PORT ?? 2567);

const app = express();
const httpServer = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("echo", EchoRoom);
gameServer.define("lobby", LobbyRoom).filterBy(["code"]);

app.get("/", (_req, res) => {
  res.send("Central de Jogos - servidor Colyseus rodando");
});

app.get("/health", async (_req, res) => {
  const [postgres, redisOk] = await Promise.all([
    checkPostgresConnection(),
    checkRedisConnection(),
  ]);

  const ok = postgres && redisOk;
  res.status(ok ? 200 : 503).json({ ok, postgres, redis: redisOk });
});

gameServer.listen(port).then(async () => {
  console.log(`Servidor Colyseus ouvindo em ws://localhost:${port}`);

  const [postgres, redisOk] = await Promise.all([
    checkPostgresConnection(),
    checkRedisConnection(),
  ]);
  console.log(`[postgres] conectado: ${postgres}`);
  console.log(`[redis] conectado: ${redisOk}`);
});
