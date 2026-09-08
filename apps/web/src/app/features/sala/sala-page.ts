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
    @if (store.reconnecting()) {
      <div class="reconnecting" role="status">
        <span class="spinner" aria-hidden="true"></span>
        Reconectando à sala…
      </div>
    }
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
  styles: `
    .reconnecting {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.7rem;
      font-size: 0.85rem;
      background: hsl(38 92% 55% / 0.15);
      color: var(--cj-warning);
      border-bottom: 1px solid hsl(38 92% 55% / 0.3);
      backdrop-filter: blur(6px);
    }
    .spinner {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid currentColor;
      border-top-color: transparent;
      animation: cj-spin 0.8s linear infinite;
    }
    @keyframes cj-spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; }
    }
  `,
})
export class SalaPage {
  protected readonly store = inject(RoomStore);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.store.connected() && !this.store.reconnecting()) {
        this.router.navigate(['/']);
      }
    });
  }
}
