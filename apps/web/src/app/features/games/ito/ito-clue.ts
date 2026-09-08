import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen, TextField } from '../../../shared/ui';
import type { ItoStateForPlayer } from './ito.types';

/** Fase `giving_clues`: cada jogador vê o próprio número e manda uma dica. */
@Component({
  selector: 'app-ito-clue',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Screen, TextField],
  template: `
    <cj-screen>
      <header>
        <p class="tag">ITO · rodada {{ state().round }}{{ totalRounds() }}</p>
        <h1>Tema: {{ state().theme }}</h1>
      </header>

      <cj-card class="secret">
        <p class="label">Seu número</p>
        <p class="num">{{ state().myNumber }}</p>
        <p class="hint">Descreva algo do tema com essa "intensidade" — sem dizer o número.</p>
      </cj-card>

      <cj-card class="form">
        @if (submitted()) {
          <p class="sent">✓ Dica enviada: <strong>"{{ sentClue() }}"</strong></p>
        } @else {
          <cj-text-field
            label="Sua dica"
            placeholder="ex: café da manhã de domingo"
            [maxlength]="60"
            [(value)]="draft"
          />
          <cj-button [block]="true" [disabled]="!draft().trim()" (click)="submit()">
            Enviar dica
          </cj-button>
        }
      </cj-card>

      <cj-card class="players">
        <p class="label">Quem já mandou</p>
        @for (c of others(); track c.id) {
          <div class="row">
            <span>{{ c.name }}</span>
            <span class="st" [class.ok]="c.done">{{ c.done ? 'pronto' : 'pensando…' }}</span>
          </div>
        }
      </cj-card>
    </cj-screen>
  `,
  styles: `
    header { text-align: center; }
    .tag {
      text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.66rem;
      color: var(--cj-game-accent); margin: 0 0 0.4rem;
    }
    h1 { font-size: 1.5rem; font-weight: 600; margin: 0; }
    .label {
      text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.68rem;
      color: var(--cj-muted); margin: 0 0 0.5rem;
    }
    .secret { text-align: center; }
    .num {
      font-family: var(--cj-font-display); font-size: 3rem; font-weight: 700;
      color: var(--cj-game-accent); margin: 0.25rem 0;
    }
    .hint { font-size: 0.82rem; color: var(--cj-muted); margin: 0.5rem 0 0; }
    .form { display: flex; flex-direction: column; gap: 0.75rem; }
    .sent { margin: 0; font-size: 0.95rem; }
    .players { display: flex; flex-direction: column; gap: 0.4rem; }
    .row {
      display: flex; justify-content: space-between;
      padding: 0.5rem 0.65rem; border-radius: 0.6rem;
      background: hsl(160 12% 13% / 0.5); font-size: 0.9rem;
    }
    .st { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--cj-muted); }
    .st.ok { color: var(--cj-success); }
  `,
})
export class ItoClue {
  readonly state = input.required<ItoStateForPlayer>();

  private readonly store = inject(RoomStore);
  protected readonly draft = signal('');
  protected readonly sentClue = signal('');

  protected readonly submitted = computed(() => {
    const me = this.store.mySessionId();
    return this.state().cards[me]?.hasSubmittedClue ?? false;
  });

  protected readonly totalRounds = computed(() => {
    const r = this.state().roundsConfig;
    return r.type === 'fixed' ? `/${r.totalRounds}` : '';
  });

  protected readonly others = computed(() => {
    const me = this.store.mySessionId();
    const players = this.store.players();
    return Object.values(this.state().cards)
      .filter((c) => c.playerId !== me)
      .map((c) => ({
        id: c.playerId,
        done: c.hasSubmittedClue,
        name: players.find((p) => p.id === c.playerId)?.nickname ?? 'Jogador',
      }));
  });

  protected submit(): void {
    const clue = this.draft().trim();
    if (!clue) return;
    this.store.sendAction({ type: 'submit_clue', clue });
    this.sentClue.set(clue);
    this.draft.set('');
  }
}
