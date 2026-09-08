import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RoomStore } from '../../../core/colyseus/room.store';
import type { ItoStateForPlayer } from './ito.types';
import { ItoClue } from './ito-clue';
import { ItoBoard } from './ito-board';
import { ItoReveal } from './ito-reveal';

/**
 * Container do ITO. Lê `store.gameState()` e mostra a tela da fase atual.
 * Fixa o accent do jogo (`--cj-game-accent`) no ITO para todas as telas filhas.
 */
@Component({
  selector: 'app-ito-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItoClue, ItoBoard, ItoReveal],
  host: { style: '--cj-game-accent: hsl(190 75% 55%); display: block' },
  template: `
    @let s = state();
    @if (s) {
      @switch (s.phase) {
        @case ('giving_clues') { <app-ito-clue [state]="s" /> }
        @case ('organizing') { <app-ito-board [state]="s" /> }
        @case ('revealed') { <app-ito-reveal [state]="s" /> }
      }
    }
  `,
})
export class ItoHost {
  private readonly store = inject(RoomStore);
  protected readonly state = computed(() => this.store.gameState() as ItoStateForPlayer | null);
}
