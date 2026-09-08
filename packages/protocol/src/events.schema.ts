/**
 * Schemas zod para validar os payloads que CHEGAM no servidor (cliente → servidor).
 * O servidor roda `.parse()` antes de confiar em qualquer coisa vinda do socket.
 *
 * Payloads de saída (servidor → cliente) não precisam de schema aqui — são
 * montados pelo próprio servidor a partir de tipos TS.
 */
import { z } from "zod";

/** `client.joinOrCreate("lobby", options)`. Campos extras são descartados. */
export const joinOptionsSchema = z
  .object({
    // Lenient de propósito: regra de negócio (vazio → gera apelido) fica no
    // servidor. Aqui só barra tipo errado e string absurda.
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
 * `game_action`: o payload é específico do jogo ativo e é validado pelo
 * `GamePlugin.applyAction` dele (CLAUDE.md §4). Aqui só garantimos que veio
 * *algo* — o roteamento no servidor não inspeciona o conteúdo.
 */
export const gameActionPayloadSchema = z.unknown();

export type JoinOptionsInput = z.infer<typeof joinOptionsSchema>;
export type SelectGamePayloadInput = z.infer<typeof selectGamePayloadSchema>;
