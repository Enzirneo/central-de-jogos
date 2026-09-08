import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    // Redis é opcional pra rodar em dev (só usado por /health por enquanto).
    // Desiste depois de algumas tentativas em vez de tentar pra sempre.
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

// O ioredis já loga sozinho cada falha de conexão ("Unhandled error event") se
// não houver um listener de erro — checkRedisConnection() já reporta isso de
// forma controlada, então aqui só evitamos o log duplicado/repetitivo.
redis.on("error", () => {});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (redis.status === "wait") {
      await redis.connect();
    }
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (err) {
    console.error("[redis] falha ao conectar:", (err as Error).message);
    return false;
  }
}
