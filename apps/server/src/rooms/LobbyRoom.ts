import { Room, Client, matchMaker } from "@colyseus/core";
import type {
  GamePlugin,
  JoinOptions,
  LobbyPlayerView,
  LobbyStatePayload,
  RoomPhase,
} from "@central-de-jogos/protocol";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@central-de-jogos/protocol";
import { joinOptionsSchema, selectGamePayloadSchema } from "../protocol-validation";
import { generateRoomCode } from "../utils/roomCode";
import { getGamePlugin } from "../games/registry";

const RECONNECTION_GRACE_SECONDS = 60;
const MAX_PLAYERS = 12; // assunção do CLAUDE.md, revisar depois
const MAX_CODE_GENERATION_ATTEMPTS = 10;
const NICKNAME_MAX_LENGTH = 20;

function sanitizeNickname(raw: unknown): string {
  const trimmed = typeof raw === "string" ? raw.trim().slice(0, NICKNAME_MAX_LENGTH) : "";
  return trimmed.length > 0 ? trimmed : `Jogador${Math.floor(Math.random() * 1000)}`;
}

/**
 * Sala única da Central. O estado é mantido em campos simples e enviado aos
 * clientes como JSON pelo evento `lobby_state` (ver docs/contrato-wire.md).
 * Não usa `@colyseus/schema` — o protocolo é 100% JSON para valer igual em
 * Angular e Flutter.
 */
export class LobbyRoom extends Room {
  maxClients = MAX_PLAYERS;

  private code = "";
  private phase: RoomPhase = "lobby";
  private hostId = "";
  private activeGameId = "";
  private pendingGameId = "";
  private readonly players = new Map<string, LobbyPlayerView>();

  private activeGame: GamePlugin<any, any, any> | null = null;
  private gameState: unknown = null;
  private pendingGameOptions: unknown = null;

  async onCreate(_options: JoinOptions) {
    this.code = await this.generateUniqueCode();

    // Torna a sala encontrável via `client.joinOrCreate("lobby", { code })` —
    // ver `filterBy(["code"])` no registro da sala em src/index.ts.
    (this.listing as unknown as { code: string }).code = this.code;
    this.listing.save();

    this.onMessage(CLIENT_EVENTS.SELECT_GAME, (client, message: unknown) => {
      const parsed = selectGamePayloadSchema.safeParse(message);
      if (!parsed.success) {
        this.sendError(client, "Escolha de jogo inválida.");
        return;
      }
      this.handleSelectGame(client, parsed.data.gameId, parsed.data.options);
    });

    this.onMessage(CLIENT_EVENTS.TOGGLE_READY, (client) => {
      this.handleToggleReady(client);
    });

    this.onMessage(CLIENT_EVENTS.CANCEL_START, (client) => {
      this.handleCancelStart(client);
    });

    this.onMessage(CLIENT_EVENTS.GAME_ACTION, (client, action: unknown) => {
      this.handleGameAction(client, action);
    });
  }

  onJoin(client: Client, rawOptions: unknown) {
    // Lenient: opções malformadas não derrubam o jogador — só ignoramos o que
    // não valida e o apelido cai no fallback do sanitizeNickname.
    const parsed = joinOptionsSchema.safeParse(rawOptions);
    const nickname = parsed.success ? parsed.data.nickname : undefined;

    this.players.set(client.sessionId, {
      id: client.sessionId,
      nickname: sanitizeNickname(nickname),
      connected: true,
      ready: false,
    });

    // O primeiro jogador da sala vira o host, responsável por escolher o jogo.
    if (!this.hostId) {
      this.hostId = client.sessionId;
    }

    // Se entrou no meio de uma partida (ex: reconexão), já manda o estado dele.
    if (this.activeGame && this.gameState) {
      this.sendGameStateToClient(client);
    }

    this.broadcastLobbyState();
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.players.get(client.sessionId);
    if (player) {
      player.connected = false;
    }
    this.broadcastLobbyState();

    // Saída intencional (o jogador fechou o app / clicou em sair): remove na hora.
    if (consented) {
      this.removePlayer(client.sessionId);
      return;
    }

    try {
      // Segura a vaga por 60s, permitindo reconectar com o mesmo sessionId.
      await this.allowReconnection(client, RECONNECTION_GRACE_SECONDS);
      const reconnected = this.players.get(client.sessionId);
      if (reconnected) {
        reconnected.connected = true;
      }
      this.broadcastLobbyState();
    } catch {
      this.removePlayer(client.sessionId);
    }
  }

  private removePlayer(sessionId: string) {
    this.players.delete(sessionId);

    // Se quem saiu era o host, passa a "faixa" pro próximo jogador conectado.
    if (this.hostId === sessionId) {
      const nextHost = [...this.players.values()].find((p) => p.connected);
      this.hostId = nextHost?.id ?? "";
    }

    if (this.phase === "starting") {
      const plugin = getGamePlugin(this.pendingGameId);
      const count = this.players.size;
      if (!plugin || count < plugin.minPlayers || count > plugin.maxPlayers) {
        this.resetToLobby();
      } else {
        this.maybeStartPendingGame(plugin);
      }
    }

    this.broadcastLobbyState();
  }

  private handleSelectGame(client: Client, gameId: string, options: unknown) {
    if (client.sessionId !== this.hostId) {
      this.sendError(client, "Só quem criou a sala pode escolher um jogo.");
      return;
    }

    if (this.phase !== "lobby") {
      this.sendError(client, "Já tem um jogo em andamento ou aguardando confirmação.");
      return;
    }

    const plugin = getGamePlugin(gameId);
    if (!plugin) {
      this.sendError(client, `Jogo "${gameId}" não encontrado no catálogo.`);
      return;
    }

    const playerCount = this.players.size;
    if (playerCount < plugin.minPlayers || playerCount > plugin.maxPlayers) {
      this.sendError(
        client,
        `${plugin.displayName} precisa de ${plugin.minPlayers} a ${plugin.maxPlayers} jogadores (tem ${playerCount}).`
      );
      return;
    }

    this.pendingGameOptions = options;
    this.pendingGameId = plugin.id;
    this.phase = "starting";
    this.clearReady();
    this.broadcastLobbyState();
  }

  private handleToggleReady(client: Client) {
    if (this.phase !== "starting") return;
    const player = this.players.get(client.sessionId);
    if (!player) return;

    player.ready = !player.ready;

    const plugin = getGamePlugin(this.pendingGameId);
    if (plugin) {
      this.maybeStartPendingGame(plugin);
    }
    this.broadcastLobbyState();
  }

  private handleCancelStart(client: Client) {
    if (client.sessionId !== this.hostId) {
      this.sendError(client, "Só quem criou a sala pode cancelar.");
      return;
    }
    if (this.phase !== "starting") return;
    this.resetToLobby();
    this.broadcastLobbyState();
  }

  private maybeStartPendingGame(plugin: GamePlugin<any, any, any>) {
    const allReady =
      this.players.size > 0 && [...this.players.values()].every((p) => p.ready);
    if (!allReady) return;

    const playerIds = [...this.players.keys()];

    this.activeGame = plugin;
    this.gameState = plugin.createInitialState(playerIds, this.pendingGameOptions);
    this.phase = "playing";
    this.activeGameId = plugin.id;
    this.pendingGameId = "";
    this.pendingGameOptions = null;
    this.clearReady();

    this.broadcastGameState();
    this.broadcastLobbyState();
  }

  private resetToLobby() {
    this.phase = "lobby";
    this.pendingGameId = "";
    this.pendingGameOptions = null;
    this.clearReady();
  }

  private handleGameAction(client: Client, action: unknown) {
    if (!this.activeGame || this.phase !== "playing") {
      this.sendError(client, "Nenhum jogo em andamento.");
      return;
    }

    this.gameState = this.activeGame.applyAction(this.gameState, client.sessionId, action);

    if (this.activeGame.isGameOver(this.gameState)) {
      const results = this.activeGame.getResults(this.gameState);
      this.broadcast(SERVER_EVENTS.GAME_OVER, results);

      this.activeGame = null;
      this.gameState = null;
      this.phase = "lobby";
      this.activeGameId = "";
      this.clearReady();
      this.broadcastLobbyState();
      return;
    }

    this.broadcastGameState();
  }

  private clearReady() {
    for (const player of this.players.values()) {
      player.ready = false;
    }
  }

  private buildLobbyState(): LobbyStatePayload {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      activeGameId: this.activeGameId,
      pendingGameId: this.pendingGameId,
      players: [...this.players.values()].map((p) => ({ ...p })),
    };
  }

  private broadcastLobbyState() {
    this.broadcast(SERVER_EVENTS.LOBBY_STATE, this.buildLobbyState());
  }

  private broadcastGameState() {
    for (const client of this.clients) {
      this.sendGameStateToClient(client);
    }
  }

  private sendGameStateToClient(client: Client) {
    if (!this.activeGame) return;
    const stateForPlayer = this.activeGame.getStateForPlayer(this.gameState, client.sessionId);
    client.send(SERVER_EVENTS.GAME_STATE, stateForPlayer);
  }

  private sendError(client: Client, message: string) {
    client.send(SERVER_EVENTS.START_GAME_ERROR, { message });
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const candidate = generateRoomCode();
      const existing = await matchMaker.query({ name: "lobby", code: candidate });
      if (existing.length === 0) {
        return candidate;
      }
    }
    throw new Error("Não foi possível gerar um código de sala único.");
  }
}
