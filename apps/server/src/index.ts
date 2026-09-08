import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { EchoRoom } from "./rooms/EchoRoom";
import { LobbyRoom } from "./rooms/LobbyRoom";
import { checkPostgresConnection } from "./db";
import { checkRedisConnection } from "./redis";
import { PORT, allowedOrigins } from "./config";

const origins = allowedOrigins();

const app = express();
app.use(cors({ origin: origins ?? true, credentials: true }));

const httpServer = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

// As rotas /matchmake/* são servidas pelo transporte do Colyseus, fora do
// middleware do express — então o CORS delas é ajustado direto no controller.
if (origins) {
  const allowed = new Set(origins);
  matchMaker.controller.getCorsHeaders = function getCorsHeaders(req) {
    const origin = (req.headers?.origin as string | undefined) ?? "";
    return { "Access-Control-Allow-Origin": allowed.has(origin) ? origin : origins[0] };
  };
}

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

gameServer.listen(PORT).then(async () => {
  console.log(`Servidor Colyseus ouvindo em ws://localhost:${PORT}`);
  console.log(`[cors] origens permitidas: ${origins ? origins.join(", ") : "todas (dev)"}`);

  const [postgres, redisOk] = await Promise.all([
    checkPostgresConnection(),
    checkRedisConnection(),
  ]);
  console.log(`[postgres] conectado: ${postgres}`);
  console.log(`[redis] conectado: ${redisOk}`);
});
