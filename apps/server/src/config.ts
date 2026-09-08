/**
 * Configuração lida do ambiente. Um lugar só para não espalhar `process.env`.
 */

export const PORT = Number(process.env.PORT ?? 2567);

/**
 * Origens permitidas para CORS (cliente Angular em dev roda em :4200).
 * `ALLOWED_ORIGINS` é uma lista separada por vírgula. Vazio/ausente → libera
 * todas as origens (conveniente em desenvolvimento).
 */
export function allowedOrigins(): string[] | null {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}
