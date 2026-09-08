import { Room, Client, matchMaker } from "@colyseus/core";
import type { GamePlugin } from "@central-de-jogos/shared-types";
import { LobbyState, PlayerState } from "./schema/LobbyState";
import { generateRoomCode } from "../utils/roomCode";
import { getGamePlugin } from "../games/registry";

interface LobbyJoinOptions {
  nickname?: string;
  code?: string;
}

interface SelectGameMessage {
  gameId?: string;
  /** Configuração específica do jogo (ex: modo, número de rodadas) — cada jogo valida a sua. */
  options?: unknown;
}

const RECONNECTION_GRACE_SECONDS = 60;
const MAX_PLAYERS = 12; // assunção do CLAUDE.md, revisar depois
const MAX_CODE_GENERATION_ATTEMPTS = 10;

function sanitizeNickname(raw: unknown): string {
  const trimmed = typeof raw === "string" ? raw.trim().slice(0, 20) : "";
  return trimmed.length > 0 ? trimmed : `Jogador${Math.floor(Math.random() * 1000)}`;
}

export class LobbyRoom extends Room<LobbyState> {
  maxClients = MAX_PLAYERS;

  private activeGame: GamePlugin<any, any, any> | null = null;
  private gameState: unknown = null;
  private pendingGameOptions: unknown = null;

  async onCreate(_options: LobbyJoinOptions) {
    this.setState(new LobbyState());

    const code = await this.generateUniqueCode();
    this.state.code = code;

    // Torna a sala encontrável via `client.join("lobby", { code })` —
    // ver `filterBy(["code"])` no registro da sala em src/index.ts.
    (this.listing as unknown as { code: string }).code = code;
    this.listing.save();

    this.onMessage("select_game", (client, message: SelectGameMessage) => {
      this.handleSelectGame(client, message?.gameId, message?.options);
    });

    this.onMessage("toggle_ready", (client) => {
      this.handleToggleReady(client);
    });

    this.onMessage("cancel_start", (client) => {
      this.handleCancelStart(client);
    });

    this.onMessage("game_action", (client, action: unknown) => {
      this.handleGameAction(client, action);
    });
  }

  onJoin(client: Client, options: LobbyJoinOptions) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.nickname = sanitizeNickname(options?.nickname);
    player.connected = true;
    this.state.players.set(client.sessionId, player);

    // O primeiro jogador da sala vira o host, responsável por escolher o jogo.
    if (!this.state.hostId) {
      this.state.hostId = client.sessionId;
    }

    // Se entrou no meio de uma partida (ex: reconexão), já manda o estado dele.
    if (this.activeGame && this.gameState) {
      this.sendGameStateToClient(client);
    }
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = false;
    }

    // Saída intencional (o jogador fechou o app / clicou em sair): remove na hora.
    if (consented) {
      this.removePlayer(client.sessionId);
      return;
    }

    try {
      // Segura a vaga por 60s, permitindo reconectar com o mesmo sessionId.
      await this.allowReconnection(client, RECONNECTION_GRACE_SECONDS);
      if (player) {
        player.connected = true;
      }
    } catch {
      this.removePlayer(client.sessionId);
    }
  }

  private removePlayer(sessionId: string) {
    this.state.players.delete(sessionId);

    // Se quem saiu era o host, passa a "faixa" pro próximo jogador conectado.
    if (this.state.hostId === sessionId) {
      const nextHost = [...this.state.players.values()].find((p) => p.connected);
      this.state.hostId = nextHost?.id ?? "";
    }

    if (this.state.phase === "starting") {
      const plugin = getGamePlugin(this.state.pendingGameId);
      const count = this.state.players.size;
      if (!plugin || count < plugin.minPlayers || count > plugin.maxPlayers) {
        this.resetToLobby();
      } else {
        this.maybeStartPendingGame(plugin);
      }
    }
  }

  private handleSelectGame(client: Client, gameId: string | undefined, options: unknown) {
    if (client.sessionId !== this.state.hostId) {
      client.send("start_game_error", { message: "Só quem criou a sala pode escolher um jogo." });
      return;
    }

    if (this.state.phase !== "lobby") {
      client.send("start_game_error", { message: "Já tem um jogo em andamento ou aguardando confirmação." });
      return;
    }

    const plugin = gameId ? getGamePlugin(gameId) : undefined;
    if (!plugin) {
      client.send("start_game_error", { message: `Jogo "${gameId}" não encontrado no catálogo.` });
      return;
    }

    const playerCount = this.state.players.size;
    if (playerCount < plugin.minPlayers || playerCount > plugin.maxPlayers) {
      client.send("start_game_error", {
        message: `${plugin.displayName} precisa de ${plugin.minPlayers} a ${plugin.maxPlayers} jogadores (tem ${playerCount}).`,
      });
      return;
    }

    this.pendingGameOptions = options;
    this.state.pendingGameId = plugin.id;
    this.state.phase = "starting";
    for (const player of this.state.players.values()) {
      player.ready = false;
    }
  }

  private handleToggleReady(client: Client) {
    if (this.state.phase !== "starting") return;
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.ready = !player.ready;

    const plugin = getGamePlugin(this.state.pendingGameId);
    if (plugin) {
      this.maybeStartPendingGame(plugin);
    }
  }

  private handleCancelStart(client: Client) {
    if (client.sessionId !== this.state.hostId) {
      client.send("start_game_error", { message: "Só quem criou a sala pode cancelar." });
      return;
    }
    if (this.state.phase !== "starting") return;
    this.resetToLobby();
  }

  private maybeStartPendingGame(plugin: GamePlugin<any, any, any>) {
    const allReady =
      this.state.players.size > 0 && [...this.state.players.values()].every((p) => p.ready);
    if (!allReady) return;

    const playerIds = [...this.state.players.keys()];

    this.activeGame = plugin;
    this.gameState = plugin.createInitialState(playerIds, this.pendingGameOptions);
    this.state.phase = "playing";
    this.state.activeGameId = plugin.id;
    this.state.pendingGameId = "";
    this.pendingGameOptions = null;
    for (const player of this.state.players.values()) {
      player.ready = false;
    }

    this.broadcastGameState();
  }

  private resetToLobby() {
    this.state.phase = "lobby";
    this.state.pendingGameId = "";
    this.pendingGameOptions = null;
    for (const player of this.state.players.values()) {
      player.ready = false;
    }
  }

  private handleGameAction(client: Client, action: unknown) {
    if (!this.activeGame || this.state.phase !== "playing") {
      client.send("start_game_error", { message: "Nenhum jogo em andamento." });
      return;
    }

    this.gameState = this.activeGame.applyAction(this.gameState, client.sessionId, action);

    if (this.activeGame.isGameOver(this.gameState)) {
      const results = this.activeGame.getResults(this.gameState);
      this.broadcast("game_over", results);

      this.activeGame = null;
      this.gameState = null;
      this.state.phase = "lobby";
      this.state.activeGameId = "";
      for (const player of this.state.players.values()) {
        player.ready = false;
      }
      return;
    }

    this.broadcastGameState();
  }

  private broadcastGameState() {
    for (const client of this.clients) {
      this.sendGameStateToClient(client);
    }
  }

  private sendGameStateToClient(client: Client) {
    if (!this.activeGame) return;
    const stateForPlayer = this.activeGame.getStateForPlayer(this.gameState, client.sessionId);
    client.send("game_state", stateForPlayer);
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
