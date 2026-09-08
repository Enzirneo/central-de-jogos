import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen } from '../../../shared/ui';
import type { ItoStateForPlayer } from './ito.types';

/** Fase `revealed`: números à mostra, resultado da rodada, ir pra próxima. */
@Component({
  selector: 'app-ito-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Screen],
  template: `
    <cj-screen>
      <header>
        <p class="tag">ITO · rodada {{ state().round }} revelada</p>
        @if (state().mode === 'consensus') {
          <h1>{{ correctPositions() }} de {{ correctOrder().length }} certas</h1>
          <p class="sub">Placar do grupo: <strong>{{ state().teamScore ?? 0 }}</strong></p>
        } @else if (winners().length) {
          <h1>Acertaram: {{ winnerNames() }}</h1>
        } @else {
          <h1>Ninguém acertou a ordem toda</h1>
        }
      </header>

      <cj-card class="order">
        <p class="label">Ordem certa (menor → maior)</p>
        @for (id of correctOrder(); track id; let i = $index) {
          <div class="slot" [class.hit]="isHit(i)" [class.self]="id === me()">
            <span class="num">{{ numberOf(id) }}</span>
            <span class="who">
              <span class="nm">{{ name(id) }}</span>
              <span class="clue">"{{ clue(id) }}"</span>
            </span>
            @if (state().mode === 'consensus') {
              <span class="mark">{{ isHit(i) ? '✓' : '' }}</span>
            }
          </div>
        }
      </cj-card>

      @if (canAdvance()) {
        <cj-card class="ready">
          <p class="rc">{{ state().readyForNextRound.length }} de {{ correctOrder().length }} prontos</p>
          <cj-button
            [block]="true"
            [variant]="iAmReady() ? 'ghost' : 'primary'"
            (click)="next()"
          >
            {{ iAmReady() ? 'Ainda não…' : 'Próxima rodada' }}
          </cj-button>
          @if (state().roundsConfig.type === 'endless') {
            <cj-button variant="ghost" [block]="true" (click)="end()">Encerrar o jogo</cj-button>
          }
        </cj-card>
      } @else {
        <cj-card class="ready">
          <p class="rc">Última rodada — resultado final chegando…</p>
        </cj-card>
      }
    </cj-screen>
  `,
  styles: `
    header { text-align: center; }
    .tag {
      text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.64rem;
      color: var(--cj-game-accent); margin: 0 0 0.4rem;
    }
    h1 { font-size: 1.4rem; font-weight: 600; margin: 0; }
    .sub { color: var(--cj-muted); margin: 0.35rem 0 0; }
    .label {
      text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.68rem;
      color: var(--cj-muted); margin: 0 0 0.5rem;
    }
    .order { display: flex; flex-direction: column; gap: 0.4rem; }
    .slot {
      display: flex; align-items: center; gap: 0.7rem;
      padding: 0.55rem 0.7rem; border-radius: 0.7rem;
      background: hsl(160 12% 13% / 0.55); border: 1px solid var(--cj-border);
    }
    .slot.hit { border-color: hsl(142 60% 45% / 0.5); background: hsl(142 60% 45% / 0.08); }
    .slot.self .nm::after { content: ' (você)'; color: var(--cj-muted); font-weight: 400; }
    .num {
      font-family: var(--cj-font-display); font-weight: 700; font-size: 1.3rem;
      color: var(--cj-game-accent); width: 2.2rem; flex-shrink: 0; text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .who { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1; }
    .nm { font-weight: 500; }
    .clue { font-size: 0.78rem; color: var(--cj-muted); font-style: italic; word-break: break-word; }
    .mark { color: var(--cj-success); font-weight: 700; }
    .ready { display: flex; flex-direction: column; gap: 0.6rem; text-align: center; }
    .rc { margin: 0; font-size: 0.85rem; color: var(--cj-muted); }
  `,
})
export class ItoReveal {
  readonly state = input.required<ItoStateForPlayer>();

  private readonly store = inject(RoomStore);

  protected readonly me = computed(() => this.store.mySessionId());
  protected readonly correctOrder = computed(() => this.state().lastRoundResult?.correctOrder ?? []);
  protected readonly correctPositions = computed(
    () => this.state().lastRoundResult?.correctPositions ?? 0,
  );
  protected readonly winners = computed(() => this.state().lastRoundResult?.winners ?? []);
  protected readonly iAmReady = computed(() =>
    this.state().readyForNextRound.includes(this.me()),
  );

  /** Há próxima rodada? (não, se for a última rodada fixa) */
  protected readonly canAdvance = computed(() => {
    const r = this.state().roundsConfig;
    return r.type === 'endless' || this.state().round < r.totalRounds;
  });

  protected readonly winnerNames = computed(() =>
    this.winners().map((id) => this.name(id)).join(', '),
  );

  protected name(id: string): string {
    return this.store.players().find((p) => p.id === id)?.nickname ?? 'Jogador';
  }
  protected clue(id: string): string {
    return this.state().cards[id]?.clue ?? '…';
  }
  protected numberOf(id: string): number | string {
    return this.state().cards[id]?.number ?? '?';
  }
  protected isHit(index: number): boolean {
    const board = this.state().lastRoundResult?.finalBoard ?? this.state().board;
    return board[index] === this.correctOrder()[index];
  }

  protected next(): void {
    this.store.sendAction({ type: 'ready_for_next_round' });
  }
  protected end(): void {
    this.store.sendAction({ type: 'end_game' });
  }
}
