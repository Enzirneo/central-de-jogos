import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen, TextField } from '../../../shared/ui';
import type { ItoStateForPlayer } from '@central-de-jogos/game-ito';

@Component({
  selector: 'app-ito-clue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, Card, Screen, Button],
  template: `
    <cj-screen>
      <cj-card class="header">
        <p class="title">🎯 ITO - Dê sua Dica!</p>
        <p class="subtitle">Rodada {{ state.round }} de {{ roundsTotal() }}</p>
        <p class="theme">Tema: <strong>{{ state.theme }}</strong></p>
      </cj-card>

      <cj-card class="secret-number">
        <p class="label">Seu número secreto:</p>
        <p class="number">{{ state.myNumber }}</p>
        <p class="hint">Use este número como base para sua dica</p>
      </cj-card>

      <cj-card class="clue-form">
        <p class="label">Sua dica (máx. 60 caracteres):</p>
        <input
          [(ngModel)]="clueText"
          placeholder="Digite uma dica criativa..."
          maxlength="60"
          (keydown.enter)="onSubmit()"
          type="text"
        />
        <p class="char-count">{{ clueText().length }} / 60</p>
        <cj-button
          [disabled]="!clueText().trim() || isSubmitted()"
          (click)="onSubmit()"
        >
          {{ isSubmitted() ? '✓ Enviado' : 'Enviar Dica' }}
        </cj-button>
      </cj-card>

      <div class="players-list">
        <cj-card *ngFor="let playerId of playerIds" [class.me]="isMe(playerId)">
          <p class="player-name">{{ playerName(playerId) }}</p>
          <p class="status" [class.submitted]="hasSubmittedClue(playerId)">
            {{ hasSubmittedClue(playerId) ? '✓ Pronto' : 'Aguardando...' }}
          </p>
          <p class="clue" *ngIf="hasSubmittedClue(playerId)">
            "{{ getClue(playerId) }}"
          </p>
        </cj-card>
      </div>
    </cj-screen>
  `,
  styles: `
    .header {
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--cj-accent) 0%, var(--cj-accent-light) 100%);
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

    .theme {
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      opacity: 0.85;
    }

    .secret-number {
      text-align: center;
      margin-bottom: 1rem;
      border-left: 4px solid var(--cj-accent);
    }

    .label {
      font-weight: 600;
      color: var(--cj-muted);
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .number {
      font-size: 3rem;
      font-weight: 700;
      color: var(--cj-accent);
      margin: 0.5rem 0;
    }

    .hint {
      font-size: 0.8rem;
      color: var(--cj-muted);
      margin: 0.5rem 0 0;
    }

    .clue-form {
      margin-bottom: 1.5rem;
    }

    input {
      display: block;
      width: 100%;
      padding: 0.75rem;
      margin: 0.5rem 0;
      border: 1px solid var(--cj-border);
      border-radius: 0.5rem;
      font-size: 1rem;
      background: var(--cj-bg-secondary);
      color: var(--cj-text);
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: var(--cj-accent);
        box-shadow: 0 0 0 2px rgba(var(--cj-accent-rgb), 0.1);
      }
    }

    .char-count {
      font-size: 0.75rem;
      color: var(--cj-muted);
      margin: 0.25rem 0 0.75rem;
    }

    .players-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    cj-card {
      &.me {
        border-color: var(--cj-accent);
        border-width: 2px;
      }
    }

    .player-name {
      font-weight: 600;
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
    }

    .status {
      font-size: 0.8rem;
      color: var(--cj-muted);
      margin: 0.25rem 0;

      &.submitted {
        color: var(--cj-accent);
        font-weight: 600;
      }
    }

    .clue {
      font-size: 0.75rem;
      font-style: italic;
      color: var(--cj-secondary);
      margin: 0.5rem 0 0;
      word-break: break-word;
    }
  `,
})
export class ItoClue {
  @Input() state!: ItoStateForPlayer;

  private readonly store = inject(RoomStore);

  protected clueText = signal('');
  protected isSubmitted = signal(false);

  protected get playerIds(): string[] {
    return Object.keys(this.state.cards);
  }

  protected roundsTotal = (): string => {
    if (this.state.roundsConfig.type === 'endless') {
      return '∞';
    }
    return this.state.roundsConfig.totalRounds.toString();
  };

  protected isMe = (playerId: string): boolean => playerId === this.store.mySessionId();

  protected playerName = (playerId: string): string => {
    const player = this.store.players().find((p) => p.id === playerId);
    return player?.nickname ?? 'Desconectado';
  };

  protected hasSubmittedClue = (playerId: string): boolean => {
    return this.state.cards[playerId]?.hasSubmittedClue ?? false;
  };

  protected getClue = (playerId: string): string => {
    return this.state.cards[playerId]?.clue ?? '';
  };

  protected onSubmit(): void {
    const clue = this.clueText().trim();
    if (clue) {
      this.store.sendAction({ type: 'submit_clue', clue });
      this.clueText.set('');
      this.isSubmitted.set(true);
    }
  }
}
