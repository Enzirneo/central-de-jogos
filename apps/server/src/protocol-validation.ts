/**
 * Schemas zod para validar os payloads que CHEGAM no servidor (cliente → servidor).
 * O servidor roda `.safeParse()` antes de confiar em qualquer coisa do socket.
 *
 * Fica aqui (e não em @central-de-jogos/protocol) de propósito: só o servidor
 * valida entrada, então o zod não precisa entrar no bundle dos clientes. O
 * contrato em si (tipos, nomes de evento) é que é compartilhado.
 */
import { z } from "zod";

/** `client.create/join("lobby", options)`. Campos extras são descartados. */
export const joinOptionsSchema = z
  .object({
    // Lenient de propósito: a regra "vazio → gera apelido" fica no servidor.
    nickname: z.string().max(50).optional(),
    code: z.string().max(16).optional(),
  })
  .strip();

export const selectGamePayloadSchema = z.object({
  gameId: z.string().min(1),
  // Opaco: cada `GamePlugin.createInitialState` valida/normaliza o seu formato.
  options: z.unknown().optional(),
});

/**
 * `game_action`: payload específico do jogo ativo, validado pelo
 * `GamePlugin.applyAction` dele (CLAUDE.md §4). Aqui é opaco.
 */
export const gameActionPayloadSchema = z.unknown();
