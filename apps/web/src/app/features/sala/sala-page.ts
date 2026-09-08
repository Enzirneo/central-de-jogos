import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoomStore } from '../../core/colyseus/room.store';
import { Lobby } from '../lobby/lobby';
import { ReadyCheck } from '../ready-check/ready-check';
import { GameHost } from '../game-host/game-host';
import { Results } from '../results/results';

/**
 * Container da sala. Uma rota só (/sala) — a tela mostrada segue o estado do
 * servidor: resultado de jogo (se houver) tem prioridade, senão a fase atual.
 */
@Component({
  selector: 'app-sala-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Lobby, ReadyCheck, GameHost, Results],
  template: `
    @if (store.results()) {
      <app-results />
    } @else {
      @switch (store.phase()) {
        @case ('starting') { <app-ready-check /> }
        @case ('playing') { <app-game-host /> }
        @default { <app-lobby /> }
      }
    }
  `,
})
export class SalaPage {
  protected readonly store = inject(RoomStore);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.store.connected()) {
        this.router.navigate(['/']);
      }
    });
  }
}
