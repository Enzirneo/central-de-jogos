import { TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ItoBoard } from './ito-board';
import { RoomStore } from '../../../core/colyseus/room.store';
import { ColyseusService } from '../../../core/colyseus/colyseus.service';
import type { ItoStateForPlayer } from './ito.types';

function state(board: string[]): ItoStateForPlayer {
  return {
    mode: 'consensus',
    roundsConfig: { type: 'fixed', totalRounds: 3 },
    theme: 'comida',
    phase: 'organizing',
    round: 1,
    cards: Object.fromEntries(
      board.map((id) => [id, { playerId: id, hasSubmittedClue: true, clue: id, number: null }]),
    ),
    lastRoundResult: null,
    myNumber: 42,
    board,
    readyToReveal: [],
    readyForNextRound: [],
    teamScore: 0,
  };
}

describe('ItoBoard', () => {
  let store: RoomStore;
  let fixture: ReturnType<typeof TestBed.createComponent<ItoBoard>>;
  let ref: ComponentRef<ItoBoard>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoomStore, { provide: ColyseusService, useValue: {} }],
    });
    store = TestBed.inject(RoomStore);
    store.mySessionId.set('p1');
    store.players.set([
      { id: 'p1', nickname: 'Ana', connected: true, ready: false },
      { id: 'p2', nickname: 'Beto', connected: true, ready: false },
      { id: 'p3', nickname: 'Dora', connected: true, ready: false },
    ]);
    fixture = TestBed.createComponent(ItoBoard);
    ref = fixture.componentRef;
    ref.setInput('state', state(['p1', 'p2', 'p3']));
    fixture.detectChanges();
  });

  it('não quebra com a ordem inicial vinda do servidor', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.slot').length).toBe(3);
    expect(el.querySelector('.slot .nm')?.textContent).toContain('Ana');
  });

  it('soltar numa nova posição reordena e envia reorder_board', () => {
    const sent: unknown[] = [];
    (store as unknown as { handle: unknown }).handle = { send: (t: string, p: unknown) => sent.push({ t, p }) };

    const cmp = fixture.componentInstance as unknown as {
      drop(e: { previousIndex: number; currentIndex: number }): void;
      order(): string[];
    };
    cmp.drop({ previousIndex: 0, currentIndex: 1 });

    expect(cmp.order()).toEqual(['p2', 'p1', 'p3']);
    expect(sent).toEqual([{ t: 'game_action', p: { type: 'reorder_board', order: ['p2', 'p1', 'p3'] } }]);
  });

  it('nova ordem do servidor reseta a cópia de trabalho', () => {
    ref.setInput('state', state(['p3', 'p2', 'p1']));
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as { order(): string[] };
    expect(cmp.order()).toEqual(['p3', 'p2', 'p1']);
  });
});
