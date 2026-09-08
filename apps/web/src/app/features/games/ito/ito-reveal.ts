import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen } from '../../../shared/ui';
import type { ItoStateForPlayer } from '@central-de-jogos/game-ito';

@Component({
  selector: 'app-ito-reveal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, Screen, Button],
  template: `
    <cj-screen>
      <cj-card class="header">
        <p class="title">🎯 Resultado da Rodada</p>
        <p class="subtitle">Rodada {{ state.round }} - Números Revelados!</p>
      </cj-card>

      <cj-card *ngIf="state.mode === 'consensus'" class="score-card">
        <p class="score-label">Pontuação da Equipe</p>
        <p class="score">{{ teamScore() }}</p>
        <p class="score-detail">{{ correctPositions() }} de {{ playerCount() }} posições corretas</p>
      </cj-card>

      <cj-card *ngIf="state.mode === 'individual'" class="winners-card">
        <p class="winners-label">🏆 Acertadores desta Rodada</p>
        <div class="winners-list">
          <ng-container *ngIf="roundWinners().length > 0">
            <span *ngFor="let winnerId of roundWinners()" class="winner-badge">
              ✓ {{ playerName(winnerId) }}
            </span>
          </ng-container>
          <span *ngIf="roundWinners().length === 0" class="no-winners">
            Ninguém acertou 100% desta vez
          </span>
        </div>
      </cj-card>

      <cj-card class="board-section">
        <p class="board-label">Ordem Correta:</p>
        <div class="board-container">
          <div
            *ngFor="let playerId of correctOrder(); let i = index"
            class="result-slot"
            [class.correct]="isCorrectPosition(i)"
          >
            <div class="slot-number">{{ i + 1 }}</div>
            <div class="slot-content">
              <div class="slot-player">{{ playerName(playerId) }}</div>
              <div class="slot-number-reveal">{{ getNumber(playerId) }}</div>
            </div>
            <div class="checkmark" *ngIf="isCorrectPosition(i)">✓</div>
          </div>
        </div>
      </cj-card>

      <cj-card class="ready-check" *ngIf="!isLastRound()">
        <p class="label">Prontos para Próxima Rodada:</p>
        <div class="ready-list">
          <span *ngFor="let playerId of state.readyForNextRound" class="ready-badge">
            ✓ {{ playerName(playerId) }}
          </span>
        </div>
        <cj-button
          [class.ready]="isReady()"
          (click)="toggleReady()"
        >
          {{ isReady() ? '✓ Pronto para Próxima' : 'Confirmar Pronto' }}
        </cj-button>
      </cj-card>

      <cj-card *ngIf="isLastRound()" class="last-round-card">
        <p class="title">✓ Última rodada concluída!</p>
        <p class="subtitle">A sala retornará ao lobby</p>
      </cj-card>

      <div class="players-details">
        <cj-card *ngFor="let playerId of playerIds; let i = index" [class.correct]="isCorrectPosition(i)">
          <p class="player-name">{{ playerName(playerId) }}</p>
          <p class="number">{{ getNumber(playerId) }}</p>
          <p class="clue">"{{ getClue(playerId) }}"</p>
          <p class="ranking" *ngIf="state.mode === 'individual'">
            {{ playerWins(playerId) }} vitória{{ playerWins(playerId) !== 1 ? 's' : '' }}
          </p>
        </cj-card>
      </div>
    </cj-screen>
  `,
  styles: `
    .header {
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--cj-tertiary) 0%, var(--cj-tertiary-light) 100%);
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

    .score-card, .winners-card {
      margin-bottom: 1rem;
      text-align: center;
      background: linear-gradient(135deg, var(--cj-tertiary-light) 0%, rgba(var(--cj-tertiary-rgb), 0.1) 100%);
    }

    .score-label, .winners-label {
      font-weight: 600;
      text-transform: uppercase;
      color: var(--cj-muted);
      font-size: 0.85rem;
      margin: 0 0 0.5rem;
    }

    .score {
      font-size: 3rem;
      font-weight: 700;
      color: var(--cj-tertiary);
      margin: 0.5rem 0;
    }

    .score-detail {
      font-size: 0.9rem;
      color: var(--cj-secondary);
      margin: 0;
    }

    .winners-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      justify-content: center;
    }

    .winner-badge {
      font-size: 0.85rem;
      padding: 0.35rem 0.75rem;
      background: var(--cj-tertiary);
      color: white;
      border-radius: 99px;
      font-weight: 600;
    }

    .no-winners {
      font-size: 0.9rem;
      color: var(--cj-muted);
      padding: 0.5rem;
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

    .result-slot {
      display: grid;
      grid-template-columns: 40px 1fr 40px;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--cj-bg-secondary);
      border: 2px solid var(--cj-border);
      border-radius: 0.5rem;
      align-items: center;
      transition: all 0.2s;

      &.correct {
        background: var(--cj-tertiary-light);
        border-color: var(--cj-tertiary);
        border-width: 3px;
      }
    }

    .slot-number {
      font-weight: 700;
      color: var(--cj-tertiary);
      text-align: center;
    }

    .slot-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .slot-player {
      font-weight: 600;
    }

    .slot-number-reveal {
      font-size: 0.9rem;
      color: var(--cj-secondary);
      font-weight: 700;
    }

    .checkmark {
      text-align: center;
      color: var(--cj-tertiary);
      font-size: 1.5rem;
      font-weight: 700;
    }

    .ready-check {
      margin-bottom: 1rem;
    }

    .label {
      font-weight: 600;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      color: var(--cj-muted);
      font-size: 0.85rem;
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

    cj-button.ready {
      background: var(--cj-secondary);
      color: white;
    }

    .last-round-card {
      background: linear-gradient(135deg, var(--cj-tertiary-light) 0%, var(--cj-secondary-light) 100%);
      text-align: center;
      margin-bottom: 1rem;
    }

    .last-round-card .title {
      color: var(--cj-tertiary);
      font-size: 1.2rem;
      margin: 0 0 0.5rem;
    }

    .last-round-card .subtitle {
      color: var(--cj-muted);
      margin: 0;
    }

    .players-details {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .players-details cj-card {
      &.correct {
        border-color: var(--cj-tertiary);
        border-width: 2px;
      }
    }

    .player-name {
      font-weight: 600;
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }

    .number {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--cj-tertiary);
      margin: 0.25rem 0;
    }

    .clue {
      font-size: 0.75rem;
      font-style: italic;
      color: var(--cj-secondary);
      margin: 0.5rem 0 0;
      word-break: break-word;
    }

    .ranking {
      font-size: 0.75rem;
      color: var(--cj-accent);
      font-weight: 600;
      margin: 0.5rem 0 0;
    }
  `,
})
export class ItoReveal {
  @Input() state!: ItoStateForPlayer;

  private readonly store = inject(RoomStore);

  protected get playerIds(): string[] {
    return this.correctOrder();
  }

  protected isMe = (playerId: string): boolean => playerId === this.store.mySessionId();

  protected playerName = (playerId: string): string => {
    const player = this.store.players().find((p) => p.id === playerId);
    return player?.nickname ?? 'Desconectado';
  };

  protected getClue = (playerId: string): string => {
    return this.state.cards[playerId]?.clue ?? '';
  };

  protected getNumber = (playerId: string): number => {
    return this.state.cards[playerId]?.number ?? 0;
  };

  protected correctOrder = computed(() => {
    return this.state.lastRoundResult?.correctOrder ?? [];
  });

  protected playerCount = (): number => {
    return Object.keys(this.state.cards).length;
  };

  protected teamScore = (): number => {
    return this.state.teamScore ?? 0;
  };

  protected correctPositions = (): number => {
    return this.state.lastRoundResult?.correctPositions ?? 0;
  };

  protected roundWinners = computed(() => {
    return this.state.lastRoundResult?.winners ?? [];
  });

  protected playerWins = (playerId: string): number => {
    return this.state.individualWins?.[playerId] ?? 0;
  };

  protected isCorrectPosition = (index: number): boolean => {
    const correct = this.correctOrder();
    const board = this.state.board;
    if (index >= correct.length || index >= board.length) return false;
    return correct[index] === board[index];
  };

  protected isReady = (): boolean => {
    return this.state.readyForNextRound.includes(this.store.mySessionId());
  };

  protected isLastRound = (): boolean => {
    if (this.state.roundsConfig.type === 'fixed') {
      return this.state.round >= this.state.roundsConfig.totalRounds;
    }
    return false;
  };

  protected toggleReady(): void {
    this.store.sendAction({ type: 'ready_for_next_round' });
  }
}
