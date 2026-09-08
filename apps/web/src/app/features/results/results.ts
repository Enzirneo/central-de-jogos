import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { RoomStore } from '../../core/colyseus/room.store';
import { Button, Card, Screen, burstConfetti } from '../../shared/ui';

/**
 * Tela de fim de jogo. Aparece enquanto `store.results()` tem valor — o
 * `sala-page` mostra isto por cima de tudo. "Voltar ao lobby" limpa o resultado.
 * Lê o `GameResults` de forma genérica (cada jogo tem seu formato).
 */
@Component({
  selector: 'app-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Screen],
  template: `
    <canvas #confetti class="confetti"></canvas>
    <cj-screen [center]="true">
      <header>
        <p class="tag">Fim de jogo</p>
        <h1>{{ headline() }}</h1>
      </header>

      @if (ranking().length) {
        <cj-card class="rank">
          @for (r of ranking(); track r.id; let i = $index) {
            <div class="row" [class.first]="i === 0" [class.self]="r.id === me()">
              <span class="pos">{{ i + 1 }}</span>
              <span class="nm">{{ r.name }}</span>
              <span class="val">{{ r.value }}</span>
            </div>
          }
        </cj-card>
      }

      <cj-button [block]="true" (click)="store.dismissResults()">Voltar ao lobby</cj-button>
    </cj-screen>
  `,
  styles: `
    :host { display: block; position: relative; }
    .confetti {
      position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 5;
    }
    header { text-align: center; }
    .tag {
      text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.66rem;
      color: var(--cj-glow); margin: 0 0 0.4rem;
    }
    h1 { font-size: clamp(1.5rem, 5vw, 2rem); font-weight: 600; margin: 0; }
    .rank { display: flex; flex-direction: column; gap: 0.4rem; }
    .row {
      display: flex; align-items: center; gap: 0.7rem;
      padding: 0.55rem 0.7rem; border-radius: 0.7rem;
      background: hsl(160 12% 13% / 0.55); border: 1px solid var(--cj-border);
    }
    .row.first { border-color: hsl(38 92% 55% / 0.4); background: hsl(38 92% 55% / 0.08); }
    .row.self .nm::after { content: ' (você)'; color: var(--cj-muted); font-weight: 400; }
    .pos {
      font-family: var(--cj-font-display); font-weight: 700; width: 1.5rem;
      text-align: center; color: var(--cj-muted); flex-shrink: 0;
    }
    .row.first .pos { color: var(--cj-warning); }
    .nm { flex: 1; font-weight: 500; }
    .val { font-family: var(--cj-font-display); font-weight: 600; font-variant-numeric: tabular-nums; }
  `,
})
export class Results {
  protected readonly store = inject(RoomStore);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('confetti');

  protected readonly me = computed(() => this.store.mySessionId());

  protected readonly headline = computed(() => {
    const r = this.store.results() ?? {};
    if (typeof r['teamScore'] === 'number') {
      return `Placar do grupo: ${r['teamScore']} em ${r['rounds'] ?? '?'} rodada(s)`;
    }
    const top = this.ranking()[0];
    return top ? `${top.name} na frente!` : 'Jogo encerrado';
  });

  /** Extrai um ranking de qualquer `Record<id, number>` que o resultado tenha. */
  protected readonly ranking = computed(() => {
    const r = this.store.results() ?? {};
    const table = (r['counters'] ?? r['wins']) as Record<string, number> | undefined;
    if (!table) return [];
    return Object.entries(table)
      .map(([id, value]) => ({
        id,
        value,
        name: this.store.players().find((p) => p.id === id)?.nickname ?? 'Jogador',
      }))
      .sort((a, b) => b.value - a.value);
  });

  constructor() {
    effect(() => {
      const el = this.canvas()?.nativeElement;
      if (el && this.store.results()) {
        burstConfetti(el);
      }
    });
  }
}
