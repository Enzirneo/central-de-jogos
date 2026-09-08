import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type GameResults,
  type LobbyPlayerView,
  type LobbyStatePayload,
  type RoomPhase,
  type StartGameErrorPayload,
} from '@central-de-jogos/protocol';
import { ColyseusService } from './colyseus.service';
import type { RoomHandle } from './room-handle';

const RECONNECT_KEY = 'cj.reconnectToken';
const RECONNECT_ATTEMPTS = 20;
const RECONNECT_DELAY_MS = 3000;

/**
 * Fonte única do estado da sala no cliente. Assina as mensagens JSON do
 * servidor (ver docs/contrato-wire.md) e expõe tudo como signals. Os
 * componentes só leem signals e chamam os métodos daqui.
 */
@Injectable({ providedIn: 'root' })
export class RoomStore {
  private readonly colyseus = inject(ColyseusService);
  private handle: RoomHandle | null = null;
  private reconnectToken = '';

  readonly connecting = signal(false);
  readonly connected = signal(false);
  /** true enquanto o cliente tenta voltar depois de uma queda (janela de 60s do servidor). */
  readonly reconnecting = signal(false);
  readonly error = signal<string | null>(null);

  readonly code = signal('');
  readonly phase = signal<RoomPhase>('lobby');
  readonly hostId = signal('');
  readonly activeGameId = signal('');
  readonly pendingGameId = signal('');
  /** Config do jogo proposto, escolhida pelo host (opaca — o jogo interpreta). */
  readonly pendingGameOptions = signal<unknown>(null);
  readonly players = signal<readonly LobbyPlayerView[]>([]);

  readonly gameState = signal<unknown>(null);
  readonly results = signal<GameResults | null>(null);

  readonly mySessionId = signal('');
  readonly isHost = computed(() => this.mySessionId() !== '' && this.mySessionId() === this.hostId());
  readonly me = computed(
    () => this.players().find((p) => p.id === this.mySessionId()) ?? null,
  );

  async create(nickname: string): Promise<void> {
    await this.connect(() => this.colyseus.create(nickname));
  }

  async join(code: string, nickname: string): Promise<void> {
    await this.connect(() => this.colyseus.join(code, nickname));
  }

  selectGame(gameId: string, options?: unknown): void {
    this.handle?.send(CLIENT_EVENTS.SELECT_GAME, { gameId, options });
  }
  /** Host ajusta a config do jogo proposto durante a fase `starting`. */
  setGameOptions(options: unknown): void {
    this.handle?.send(CLIENT_EVENTS.SET_GAME_OPTIONS, { options });
  }
  toggleReady(): void {
    this.handle?.send(CLIENT_EVENTS.TOGGLE_READY);
  }
  cancelStart(): void {
    this.handle?.send(CLIENT_EVENTS.CANCEL_START);
  }
  sendAction(action: unknown): void {
    this.handle?.send(CLIENT_EVENTS.GAME_ACTION, action);
  }

  clearError(): void {
    this.error.set(null);
  }

  /** Fecha a tela de resultados e volta pro lobby. */
  dismissResults(): void {
    this.results.set(null);
  }

  leave(): void {
    this.handle?.leave();
    this.reset();
  }

  private async connect(open: () => Promise<RoomHandle>): Promise<void> {
    if (this.connecting()) return;
    this.connecting.set(true);
    this.error.set(null);
    try {
      this.bind(await open());
    } catch (err) {
      this.error.set(describeError(err));
    } finally {
      this.connecting.set(false);
    }
  }

  private bind(handle: RoomHandle): void {
    this.handle = handle;
    this.reconnectToken = handle.reconnectionToken;
    this.mySessionId.set(handle.sessionId);
    this.connected.set(true);
    this.reconnecting.set(false);
    try {
      localStorage.setItem(RECONNECT_KEY, handle.reconnectionToken);
    } catch {
      /* private mode / storage bloqueado — reconexão fica indisponível, ok */
    }

    handle.onMessage<LobbyStatePayload>(SERVER_EVENTS.LOBBY_STATE, (s) => {
      this.code.set(s.code);
      this.phase.set(s.phase);
      this.hostId.set(s.hostId);
      this.activeGameId.set(s.activeGameId);
      this.pendingGameOptions.set(s.pendingGameOptions);
      this.pendingGameId.set(s.pendingGameId);
      this.players.set(s.players);
      if (s.phase !== 'playing') {
        this.gameState.set(null);
      }
      // um jogo novo começou → some com o resultado do anterior
      if (s.phase === 'starting' || s.phase === 'playing') {
        this.results.set(null);
      }
    });

    handle.onMessage(SERVER_EVENTS.GAME_STATE, (state) => {
      this.results.set(null);
      this.gameState.set(state);
    });

    handle.onMessage<GameResults>(SERVER_EVENTS.GAME_OVER, (results) => {
      this.gameState.set(null);
      this.results.set(results);
    });

    handle.onMessage<StartGameErrorPayload>(SERVER_EVENTS.START_GAME_ERROR, (e) => {
      this.error.set(e.message);
    });

    handle.onLeave((code) => {
      this.connected.set(false);
      // 1000 = saída limpa (o próprio jogador saiu). Qualquer outro código é
      // queda: tenta voltar dentro da janela de tolerância do servidor.
      if (code === 1000 || this.reconnectToken === '') {
        this.reset();
      } else {
        void this.attemptReconnect();
      }
    });
    handle.onError((_code, message) => this.error.set(message ?? 'Erro de conexão com a sala.'));
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnecting()) return;
    this.reconnecting.set(true);
    const token = this.reconnectToken;

    for (let i = 0; i < RECONNECT_ATTEMPTS && this.reconnecting(); i++) {
      try {
        this.bind(await this.colyseus.reconnect(token));
        return;
      } catch {
        await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS));
      }
    }
    // não voltou a tempo
    this.error.set('Você perdeu a conexão com a sala.');
    this.reset();
  }

  private reset(): void {
    this.handle = null;
    this.reconnectToken = '';
    this.connected.set(false);
    this.reconnecting.set(false);
    this.code.set('');
    this.phase.set('lobby');
    this.hostId.set('');
    this.activeGameId.set('');
    this.pendingGameId.set('');
    this.players.set([]);
    this.gameState.set(null);
    this.results.set(null);
    this.mySessionId.set('');
    try {
      localStorage.removeItem(RECONNECT_KEY);
    } catch {
      /* noop */
    }
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  const maybe = err as { message?: unknown };
  return typeof maybe?.message === 'string' ? maybe.message : 'Não foi possível conectar à sala.';
}
