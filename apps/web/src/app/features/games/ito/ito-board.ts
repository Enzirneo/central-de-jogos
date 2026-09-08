import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen } from '../../../shared/ui';
import type { ItoStateForPlayer } from '@central-de-jogos/game-ito';

@Component({
  selector: 'app-ito-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, Screen, Button],
  template: `
    <cj-screen>
      <cj-card class="header">
        <p class="title">🎲 Reorganize as Posições</p>
        <p class="subtitle">Rodada {{ state.round }} - Reorganize com base nas dicas</p>
        <p class="mode-badge">{{ state.mode === 'consensus' ? '👥 Modo Consenso' : '🎯 Modo Individual' }}</p>
      </cj-card>

      <cj-card class="board-section">
        <p class="board-label">Ordem Atual:</p>
        <div class="board-container">
          <div
            *ngFor="let playerId of board(); let i = index"
            class="board-slot"
            (click)="onSelectSlot(i)"
            [class.selected]="selectedSlot() === i"
          >
            <div class="slot-number">{{ i + 1 }}</div>
            <div class="slot-player">{{ playerName(playerId) }}</div>
            <div class="slot-clue">{{ getClue(playerId) }}</div>
          </div>
        </div>
      </cj-card>

      <cj-card class="controls">
        <p class="label">Mover Jogador:</p>
        <div class="button-group">
          <cj-button [disabled]="!canMoveUp()" (click)="moveUp()">
            ↑ Mover para Cima
          </cj-button>
          <cj-button [disabled]="!canMoveDown()" (click)="moveDown()">
            ↓ Mover para Baixo
          </cj-button>
        </div>
        <p class="help-text" *ngIf="selectedSlot() !== null">
          Clique no jogador para selecioná-lo, depois use os botões para reordenar
        </p>
      </cj-card>

      <cj-card class="ready-check">
        <p class="label">Prontos para Revelar:</p>
        <div class="ready-list">
          <span *ngFor="let playerId of state.readyToReveal" class="ready-badge">
            ✓ {{ playerName(playerId) }}
          </span>
          <span *ngIf="!isReady()" class="not-ready">
            Você ainda não confirmou
          </span>
        </div>
        <cj-button
          [class.ready]="isReady()"
          (click)="toggleReady()"
        >
          {{ isReady() ? '✓ Pronto para Revelar' : 'Confirmar Pronto' }}
        </cj-button>
      </cj-card>

      <div class="players-reference">
        <cj-card *ngFor="let playerId of playerIds" [class.me]="isMe(playerId)">
          <p class="player-name">{{ playerName(playerId) }}</p>
          <p class="clue">"{{ getClue(playerId) }}"</p>
        </cj-card>
      </div>
    </cj-screen>
  `,
  styles: `
    .header {
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--cj-secondary) 0%, var(--cj-secondary-light) 100%);
      color: white;
    }

    .title {
      font-family: var(--cj-font-display);
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
      color: white;
    }

    .subtitle {
      margin: 0.25rem 0;
      opacity: 0.9;
    }

    .mode-badge {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      padding: 0.25rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 99px;
      display: inline-block;
      opacity: 0.95;
    }

    .board-section {
      margin-bottom: 1rem;
    }

    .board-label {
      font-weight: 600;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      color: var(--cj-muted);
      font-size: 0.85rem;
    }

    .board-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .board-slot {
      display: grid;
      grid-template-columns: 40px 1fr auto;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--cj-bg-secondary);
      border: 2px solid var(--cj-border);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      align-items: center;

      &:hover {
        background: var(--cj-bg-tertiary);
        border-color: var(--cj-secondary);
      }

      &.selected {
        background: var(--cj-secondary-light);
        border-color: var(--cj-secondary);
        border-width: 3px;
      }
    }

    .slot-number {
      font-weight: 700;
      color: var(--cj-secondary);
      text-align: center;
    }

    .slot-player {
      font-weight: 600;
    }

    .slot-clue {
      font-size: 0.8rem;
      color: var(--cj-muted);
      font-style: italic;
    }

    .controls {
      margin-bottom: 1rem;
    }

    .label {
      font-weight: 600;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      color: var(--cj-muted);
      font-size: 0.85rem;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    cj-button {
      flex: 1;
    }

    .help-text {
      font-size: 0.75rem;
      color: var(--cj-muted);
      margin: 0;
      font-style: italic;
    }

    .ready-check {
      margin-bottom: 1rem;
    }

    .ready-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .ready-badge {
      font-size: 0.8rem;
      padding: 0.25rem 0.75rem;
      background: var(--cj-secondary);
      color: white;
      border-radius: 99px;
    }

    .not-ready {
      font-size: 0.8rem;
      color: var(--cj-muted);
      padding: 0.25rem 0.75rem;
    }

    cj-button.ready {
      background: var(--cj-secondary);
      color: white;
    }

    .players-reference {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .players-reference cj-card {
      &.me {
        border-color: var(--cj-accent);
        border-width: 2px;
      }
    }

    .player-name {
      font-weight: 600;
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }

    .clue {
      font-size: 0.75rem;
      font-style: italic;
      color: var(--cj-secondary);
      margin: 0;
      word-break: break-word;
    }
  `,
})
export class ItoBoard {
  @Input() state!: ItoStateForPlayer;

  private readonly store = inject(RoomStore);

  protected currentBoard = signal<string[]>(this.state.board);
  protected selectedSlot = signal<number | null>(null);

  protected board = computed(() => this.currentBoard());

  protected get playerIds(): string[] {
    return Object.keys(this.state.cards);
  }

  protected isMe = (playerId: string): boolean => playerId === this.store.mySessionId();

  protected playerName = (playerId: string): string => {
    const player = this.store.players().find((p) => p.id === playerId);
    return player?.nickname ?? 'Desconectado';
  };

  protected getClue = (playerId: string): string => {
    return this.state.cards[playerId]?.clue ?? '';
  };

  protected isReady = (): boolean => {
    return this.state.readyToReveal.includes(this.store.mySessionId());
  };

  protected onSelectSlot(index: number): void {
    this.selectedSlot.set(this.selectedSlot() === index ? null : index);
  }

  protected canMoveUp = (): boolean => {
    const idx = this.selectedSlot();
    return idx !== null && idx > 0;
  };

  protected canMoveDown = (): boolean => {
    const idx = this.selectedSlot();
    return idx !== null && idx < this.currentBoard().length - 1;
  };

  protected moveUp(): void {
    const idx = this.selectedSlot();
    if (idx === null || idx === 0) return;

    const newBoard = [...this.currentBoard()];
    [newBoard[idx], newBoard[idx - 1]] = [newBoard[idx - 1], newBoard[idx]];
    this.currentBoard.set(newBoard);
    this.selectedSlot.set(idx - 1);
    this.sendBoard();
  }

  protected moveDown(): void {
    const idx = this.selectedSlot();
    if (idx === null || idx === this.currentBoard().length - 1) return;

    const newBoard = [...this.currentBoard()];
    [newBoard[idx], newBoard[idx + 1]] = [newBoard[idx + 1], newBoard[idx]];
    this.currentBoard.set(newBoard);
    this.selectedSlot.set(idx + 1);
    this.sendBoard();
  }

  protected toggleReady(): void {
    this.store.sendAction({ type: 'ready_to_reveal' });
  }

  private sendBoard(): void {
    this.store.sendAction({ type: 'reorder_board', order: this.currentBoard() });
  }
}
