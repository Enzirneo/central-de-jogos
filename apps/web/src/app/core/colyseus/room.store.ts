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

/**
 * Fonte única do estado da sala no cliente. Assina as mensagens JSON do
 * servidor (ver docs/contrato-wire.md) e expõe tudo como signals. Os
 * componentes só leem signals e chamam os métodos daqui.
 */
@Injectable({ providedIn: 'root' })
export class RoomStore {
  private readonly colyseus = inject(ColyseusService);
  private handle: RoomHandle | null = null;

  readonly connecting = signal(false);
  readonly connected = signal(false);
  readonly error = signal<string | null>(null);

  readonly code = signal('');
  readonly phase = signal<RoomPhase>('lobby');
  readonly hostId = signal('');
  readonly activeGameId = signal('');
  readonly pendingGameId = signal('');
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
    this.mySessionId.set(handle.sessionId);
    this.connected.set(true);
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
      this.pendingGameId.set(s.pendingGameId);
      this.players.set(s.players);
      if (s.phase !== 'playing') {
        this.gameState.set(null);
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

    handle.onLeave(() => this.connected.set(false));
    handle.onError((_code, message) => this.error.set(message ?? 'Erro de conexão com a sala.'));
  }

  private reset(): void {
    this.handle = null;
    this.connected.set(false);
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
