import { TestBed } from '@angular/core/testing';
import { ItoConfig } from './ito-config';
import { RoomStore } from '../../../core/colyseus/room.store';
import { ColyseusService } from '../../../core/colyseus/colyseus.service';

describe('ItoConfig', () => {
  let store: RoomStore;
  let sent: unknown[];

  function make() {
    const fixture = TestBed.createComponent(ItoConfig);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoomStore, { provide: ColyseusService, useValue: {} }],
    });
    store = TestBed.inject(RoomStore);
    sent = [];
    (store as unknown as { handle: unknown }).handle = {
      send: (t: string, p: unknown) => sent.push({ t, p }),
    };
    store.mySessionId.set('p1');
    store.hostId.set('p1');
  });

  it('host: trocar o modo manda set_game_options com o objeto inteiro', () => {
    const el = make().nativeElement as HTMLElement;
    const individual = [...el.querySelectorAll('.opts button')].find((b) =>
      b.textContent?.includes('Cada um por si'),
    ) as HTMLButtonElement;
    individual.click();

    expect(sent).toEqual([
      {
        t: 'set_game_options',
        p: { options: { mode: 'individual', rounds: { type: 'fixed', totalRounds: 5 } } },
      },
    ]);
  });

  it('não-host: mostra só o resumo, sem controles', () => {
    store.hostId.set('outro');
    store.pendingGameOptions.set({ mode: 'individual', rounds: { type: 'endless' } });
    const el = make().nativeElement as HTMLElement;

    expect(el.querySelector('.opts')).toBeNull();
    expect(el.querySelector('.ro')?.textContent).toContain('Cada um por si');
    expect(el.querySelector('.ro')?.textContent).toContain('sem fim');
  });
});
