import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen } from '../../../shared/ui';

interface TemplateStateForPlayer {
  myCount: number;
  target: number;
  counters: Record<string, number>;
}

/**
 * Jogo de teste: cada jogador clica até o alvo. O estado vem inteiro de
 * `store.gameState()`. Serve de exemplo mínimo de componente de jogo.
 */
@Component({
  selector: 'app-template-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Screen],
  template: `
    <cj-screen [center]="true">
      <header>
        <p class="tag">🔢 Contador</p>
        <h1>Clique até {{ state()?.target ?? 0 }}</h1>
      </header>

      <cj-card class="me">
        <p class="count">{{ state()?.myCount ?? 0 }}</p>
        <cj-button [block]="true" (click)="increment()">Incrementar</cj-button>
      </cj-card>

      <cj-card class="others">
        @for (row of rows(); track row.id) {
          <div class="row" [class.self]="row.self">
            <span>{{ row.name }}</span>
            <span class="n">{{ row.count }} / {{ state()?.target ?? 0 }}</span>
          </div>
        }
      </cj-card>
    </cj-screen>
  `,
  styles: `
    header { text-align: center; }
    .tag {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.68rem;
      color: var(--cj-glow);
      margin: 0 0 0.4rem;
    }
    h1 { font-size: 1.6rem; font-weight: 600; margin: 0; }
    .me { text-align: center; display: flex; flex-direction: column; gap: 0.75rem; }
    .count {
      font-family: var(--cj-font-display);
      font-size: 3rem;
      font-weight: 700;
      color: var(--cj-glow);
      margin: 0;
    }
    .others { display: flex; flex-direction: column; gap: 0.4rem; }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0.65rem;
      border-radius: 0.6rem;
      background: hsl(160 12% 13% / 0.5);
      font-size: 0.9rem;
    }
    .row.self { border: 1px solid hsl(152 22% 56% / 0.4); }
    .n { color: var(--cj-muted); font-variant-numeric: tabular-nums; }
  `,
})
export class TemplateCounter {
  private readonly store = inject(RoomStore);

  protected readonly state = computed(() => this.store.gameState() as TemplateStateForPlayer | null);

  protected readonly rows = computed(() => {
    const counters = this.state()?.counters ?? {};
    const me = this.store.mySessionId();
    return Object.entries(counters).map(([id, count]) => ({
      id,
      count,
      self: id === me,
      name: this.store.players().find((p) => p.id === id)?.nickname ?? 'Jogador',
    }));
  });

  protected increment(): void {
    this.store.sendAction({ type: 'increment' });
  }
}
