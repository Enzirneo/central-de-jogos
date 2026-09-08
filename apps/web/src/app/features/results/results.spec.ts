import { TestBed } from '@angular/core/testing';
import { Results } from './results';
import { RoomStore } from '../../core/colyseus/room.store';
import { ColyseusService } from '../../core/colyseus/colyseus.service';

describe('Results', () => {
  let store: RoomStore;
  let cmp: Results & {
    ranking(): Array<{ id: string; value: number; name: string }>;
    headline(): string;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoomStore, { provide: ColyseusService, useValue: {} }],
    });
    store = TestBed.inject(RoomStore);
    store.players.set([
      { id: 'p1', nickname: 'Ana', connected: true, ready: false },
      { id: 'p2', nickname: 'Beto', connected: true, ready: false },
    ]);
    cmp = TestBed.createComponent(Results).componentInstance as never;
  });

  it('monta ranking a partir de counters (jogo Contador), maior primeiro', () => {
    store.results.set({ target: 5, counters: { p1: 3, p2: 5 } });
    expect(cmp.ranking().map((r) => `${r.name}:${r.value}`)).toEqual(['Beto:5', 'Ana:3']);
    expect(cmp.headline()).toContain('Beto');
  });

  it('monta ranking a partir de wins (ITO individual)', () => {
    store.results.set({ mode: 'individual', wins: { p1: 2, p2: 0 }, rounds: 3 });
    expect(cmp.ranking().map((r) => r.name)).toEqual(['Ana', 'Beto']);
  });

  it('ITO consensus vira headline com o placar do grupo', () => {
    store.results.set({ mode: 'consensus', teamScore: 4, rounds: 3 });
    expect(cmp.ranking()).toEqual([]);
    expect(cmp.headline()).toContain('Placar do grupo: 4');
  });
});
