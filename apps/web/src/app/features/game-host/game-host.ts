import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { findCatalogEntry } from '@central-de-jogos/protocol';
import { RoomStore } from '../../core/colyseus/room.store';
import { loadGameComponent } from '../../core/colyseus/game-registry';
import { Card, Screen, burstConfetti } from '../../shared/ui';

/**
 * Container que carrega o componente do jogo ativo por id via registry.
 * Mostra o jogo enquanto `phase === playing`; ao terminar, exibe a tela de
 * resultados com confetti.
 */
@Component({
  selector: 'app-game-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, Screen, NgComponentOutlet],
  template: `
    <ng-container [ngSwitch]="showingResults()">
      <div *ngSwitchCase="false" class="game-container">
        <ng-container *ngComponentOutlet="gameComponent()" />
      </div>

      <div *ngSwitchCase="true" class="results-screen">
        <canvas #confettiCanvas class="confetti"></canvas>
        <cj-screen>
          <cj-card class="results-card">
            <p class="emoji">🏆</p>
            <p class="title">Jogo Encerrado!</p>
            <pre>{{ store.results() | json }}</pre>
          </cj-card>
        </cj-screen>
      </div>
    </ng-container>
  `,
  styles: `
    .game-container {
      width: 100%;
      height: 100vh;
    }

    .results-screen {
      position: relative;
      width: 100%;
      height: 100vh;
    }

    .confetti {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }

    .results-card {
      text-align: center;
    }

    .emoji {
      font-size: 3rem;
      margin: 0 0 1rem;
    }

    .title {
      font-family: var(--cj-font-display);
      font-size: 1.5rem;
      margin: 0 0 1rem;
    }

    pre {
      font-size: 0.75rem;
      color: var(--cj-muted);
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
  `,
})
export class GameHost {
  protected readonly store = inject(RoomStore);

  @ViewChild('confettiCanvas', { read: ElementRef }) confettiCanvas?: ElementRef<HTMLCanvasElement>;

  readonly gameComponent = signal<Type<unknown> | null>(null);

  protected game = computed(() => findCatalogEntry(this.store.activeGameId()));
  protected showingResults = computed(() => this.store.results() !== null);

  constructor() {
    // Carrega componente quando o jogo ativo muda
    effect(() => {
      const gameId = this.store.activeGameId();
      if (gameId && !this.gameComponent()) {
        this.loadAndSetGameComponent(gameId);
      }
    });

    // Dispara confetti quando os resultados chegam
    effect(() => {
      if (this.showingResults() && this.confettiCanvas?.nativeElement) {
        afterNextRender(() => {
          const canvas = this.confettiCanvas?.nativeElement;
          if (canvas) {
            burstConfetti(canvas);
          }
        });
      }
    });
  }

  private async loadAndSetGameComponent(gameId: string): Promise<void> {
    try {
      const component = await loadGameComponent(gameId);
      if (component) {
        this.gameComponent.set(component);
      }
    } catch (err) {
      console.error(`Falha ao carregar componente de jogo ${gameId}:`, err);
    }
  }
}
