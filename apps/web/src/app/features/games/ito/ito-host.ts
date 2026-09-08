import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomStore } from '../../../core/colyseus/room.store';
import type { ItoStateForPlayer } from '@central-de-jogos/game-ito';
import { ItoClue } from './ito-clue';
import { ItoBoard } from './ito-board';
import { ItoReveal } from './ito-reveal';

@Component({
  selector: 'app-ito-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ItoClue, ItoBoard, ItoReveal],
  template: `
    <ng-container [ngSwitch]="state()?.phase">
      <app-ito-clue *ngSwitchCase="'giving_clues'" [state]="state()!" />
      <app-ito-board *ngSwitchCase="'organizing'" [state]="state()!" />
      <app-ito-reveal *ngSwitchCase="'revealed'" [state]="state()!" />
    </ng-container>
  `,
})
export class ItoHost {
  private readonly store = inject(RoomStore);

  protected state = computed(() => {
    const gameState = this.store.gameState();
    return gameState as ItoStateForPlayer | null;
  });
}
