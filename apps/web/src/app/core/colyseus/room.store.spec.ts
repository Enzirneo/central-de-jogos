import { TestBed } from '@angular/core/testing';
import { CLIENT_EVENTS, SERVER_EVENTS, type LobbyStatePayload } from '@central-de-jogos/protocol';
import { RoomStore } from './room.store';
import { ColyseusService } from './colyseus.service';
import type { RoomHandle } from './room-handle';

/** Sala falsa: guarda o que foi enviado e deixa o teste "emitir" mensagens. */
class FakeRoomHandle implements RoomHandle {
  sessionId = 'me-1';
  reconnectionToken = 'tok-1';
  readonly sent: Array<{ type: string; payload?: unknown }> = [];
  private handlers = new Map<string, (p: any) => void>();

  onMessage<T>(type: string, cb: (payload: T) => void): void {
    this.handlers.set(type, cb as (p: any) => void);
  }
  send(type: string, payload?: unknown): void {
    this.sent.push({ type, payload });
  }
  onLeave(): void {}
  onError(): void {}
  leave(): void {}

  emit(type: string, payload: unknown): void {
    this.handlers.get(type)?.(payload);
  }
}

function lobbyState(over: Partial<LobbyStatePayload> = {}): LobbyStatePayload {
  return {
    code: 'ABCD',
    phase: 'lobby',
    hostId: 'me-1',
    activeGameId: '',
    pendingGameId: '',
    players: [{ id: 'me-1', nickname: 'Ana', connected: true, ready: false }],
    ...over,
  };
}

describe('RoomStore', () => {
  let store: RoomStore;
  let fake: FakeRoomHandle;

  beforeEach(async () => {
    fake = new FakeRoomHandle();
    const colyseusFake: Partial<ColyseusService> = {
      create: async () => fake,
      join: async () => fake,
    };
    TestBed.configureTestingModule({
      providers: [RoomStore, { provide: ColyseusService, useValue: colyseusFake }],
    });
    store = TestBed.inject(RoomStore);
    await store.create('Ana');
  });

  it('conecta e identifica o próprio jogador como host', () => {
    expect(store.connected()).toBe(true);
    expect(store.mySessionId()).toBe('me-1');
    fake.emit(SERVER_EVENTS.LOBBY_STATE, lobbyState());
    expect(store.isHost()).toBe(true);
    expect(store.code()).toBe('ABCD');
    expect(store.players().length).toBe(1);
  });

  it('reflete a transição de fase pelo lobby_state', () => {
    fake.emit(SERVER_EVENTS.LOBBY_STATE, lobbyState({ phase: 'starting', pendingGameId: 'ito' }));
    expect(store.phase()).toBe('starting');
    expect(store.pendingGameId()).toBe('ito');
  });

  it('guarda o game_state e limpa nos resultados', () => {
    fake.emit(SERVER_EVENTS.GAME_STATE, { myCount: 2, target: 5 });
    expect(store.gameState()).toEqual({ myCount: 2, target: 5 });

    fake.emit(SERVER_EVENTS.GAME_OVER, { target: 5, counters: { 'me-1': 5 } });
    expect(store.results()).toEqual({ target: 5, counters: { 'me-1': 5 } });
    expect(store.gameState()).toBeNull();
  });

  it('start_game_error vira mensagem de erro', () => {
    fake.emit(SERVER_EVENTS.START_GAME_ERROR, { message: 'Só o host escolhe.' });
    expect(store.error()).toBe('Só o host escolhe.');
    store.clearError();
    expect(store.error()).toBeNull();
  });

  it('os métodos enviam os eventos certos ao servidor', () => {
    store.selectGame('ito', { modo: 'x' });
    store.toggleReady();
    store.sendAction({ type: 'increment' });
    expect(fake.sent).toEqual([
      { type: CLIENT_EVENTS.SELECT_GAME, payload: { gameId: 'ito', options: { modo: 'x' } } },
      { type: CLIENT_EVENTS.TOGGLE_READY, payload: undefined },
      { type: CLIENT_EVENTS.GAME_ACTION, payload: { type: 'increment' } },
    ]);
  });
});
