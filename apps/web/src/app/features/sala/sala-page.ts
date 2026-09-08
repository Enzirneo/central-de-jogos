import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoomStore } from '../../core/colyseus/room.store';
import { Lobby } from '../lobby/lobby';
import { ReadyCheck } from '../ready-check/ready-check';
import { GameHost } from '../game-host/game-host';

/**
 * Container da sala. Uma rota só (/sala) — a tela mostrada segue a fase do
 * servidor (lobby / starting / playing), evitando dessincronizar rota e estado.
 */
@Component({
  selector: 'app-sala-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Lobby, ReadyCheck, GameHost],
  template: `
    @switch (phase()) {
      @case ('starting') {
        <app-ready-check />
      }
      @case ('playing') {
        <app-game-host />
      }
      @default {
        <app-lobby />
      }
    }
  `,
})
export class SalaPage {
  private readonly store = inject(RoomStore);
  private readonly router = inject(Router);
  protected readonly phase = this.store.phase;

  constructor() {
    effect(() => {
      if (!this.store.connected()) {
        this.router.navigate(['/']);
      }
    });
  }
}
