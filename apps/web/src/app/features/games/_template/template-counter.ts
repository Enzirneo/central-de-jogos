import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen } from '../../../shared/ui';

interface TemplateGameStateForPlayer {
  myCount: number;
  target: number;
  counters: Record<string, number>;
}

/**
 * Jogo de teste: contador.
 * Cada jogador clica até atingir o alvo (5 cliques). Quem termina primeiro ganha.
 * O estado vem integralmente de `store.gameState()` (obtido do servidor).
 */
@Component({
  selector: 'app-template-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, Screen, Button],
  template: `
    <cj-screen>
      <cj-card class="header">
        <p class="title">🔢 Contador de Teste</p>
        <p class="subtitle">Clique até atingir {{ state()?.target }} cliques!</p>
      </cj-card>

      <div class="players-grid">
        <cj-card *ngFor="let playerId of playerIds()" [class.me]="isMe(playerId)">
          <p class="player-name">{{ playerName(playerId) }}</p>
          <p class="counter">{{ getCounter(playerId) }} / {{ state()?.target }}</p>
          <cj-button *ngIf="isMe(playerId)" (click)="onIncrement()">
            Incrementar
          </cj-button>
        </cj-card>
      </div>
    </cj-screen>
  `,
  styles: `
    .header {
      margin-bottom: 1.5rem;
    }
    .title {
      font-family: var(--cj-font-display);
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
    }
    .subtitle {
      color: var(--cj-muted);
      margin: 0;
    }

    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }
    cj-card {
      text-align: center;
      &.me {
        border-color: var(--cj-accent);
      }
    }

    .player-name {
      font-weight: 600;
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }
    .counter {
      font-size: 2rem;
      font-weight: 700;
      color: var(--cj-accent);
      margin: 0.5rem 0;
    }
  `,
})
export class TemplateCounter {
  protected readonly store = inject(RoomStore);

  protected state = (): TemplateGameStateForPlayer | null => {
    const state = this.store.gameState() as TemplateGameStateForPlayer | null;
    return state;
  };

  protected playerIds = (): string[] => {
    const s = this.state();
    return s ? Object.keys(s.counters) : [];
  };

  protected isMe = (playerId: string): boolean => playerId === this.store.mySessionId();

  protected playerName = (playerId: string): string => {
    const player = this.store.players().find((p: { id: string }) => p.id === playerId);
    return player?.nickname ?? `Jogador ${playerId}`;
  };

  protected getCounter = (playerId: string): number => {
    const s = this.state();
    return s?.counters[playerId] ?? 0;
  };

  protected onIncrement(): void {
    this.store.sendAction({ type: 'increment' });
  }
}
