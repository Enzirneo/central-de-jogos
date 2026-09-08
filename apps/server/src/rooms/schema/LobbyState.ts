import { Schema, type, MapSchema } from "@colyseus/schema";

export class PlayerState extends Schema {
  /** Gerado pelo servidor (sessionId do Colyseus) — nunca escolhido pelo cliente. */
  @type("string") id: string = "";

  @type("string") nickname: string = "";

  /**
   * Vazio = sem conta vinculada. Reservado para quando o sistema de contas
   * existir; por enquanto todo jogador entra só com apelido temporário.
   */
  @type("string") accountId: string = "";

  /** false enquanto o jogador está no período de tolerância a desconexão. */
  @type("boolean") connected: boolean = true;

  /** true quando o jogador confirmou "pronto" durante a fase "starting". */
  @type("boolean") ready: boolean = false;
}

export class LobbyState extends Schema {
  /** Código curto de 4 letras usado por outros jogadores para entrar na sala. */
  @type("string") code: string = "";

  /**
   * "lobby" | "starting" | "playing" — controla qual tela a Central mostra.
   * "starting": o host propôs um jogo e a sala espera todo mundo confirmar
   * "pronto" antes de instanciar o `GamePlugin` de verdade.
   */
  @type("string") phase: string = "lobby";

  /** Id do jogo do catálogo em andamento; vazio quando `phase !== "playing"`. */
  @type("string") activeGameId: string = "";

  /** Id do jogo proposto pelo host, aguardando confirmação; só durante "starting". */
  @type("string") pendingGameId: string = "";

  /** sessionId de quem criou a sala — só ele pode escolher/iniciar um jogo. */
  @type("string") hostId: string = "";

  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
