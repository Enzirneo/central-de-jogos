import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card, Screen } from '../../../shared/ui';
import type { ItoStateForPlayer } from './ito.types';

/**
 * Fase `organizing`: ordenar as cartas do menor pro maior, só pelas dicas.
 * `consensus` = um quadro pra todos; `individual` = o palpite privado de cada um.
 */
@Component({
  selector: 'app-ito-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Screen],
  template: `
    <cj-screen>
      <header>
        <p class="tag">
          ITO · organizar ·
          {{ state().mode === 'consensus' ? 'quadro do grupo' : 'seu palpite' }}
        </p>
        <h1>Do menor pro maior</h1>
        <p class="hint">Toque num nome, depois ↑ / ↓. Só as dicas — nada de dizer números.</p>
      </header>

      <cj-card class="board">
        @for (id of order(); track id; let i = $index) {
          <button
            type="button"
            class="slot"
            [class.sel]="selected() === i"
            [class.self]="id === me()"
            (click)="select(i)"
          >
            <span class="pos">{{ i + 1 }}</span>
            <span class="who">
              <span class="nm">{{ name(id) }}</span>
              <span class="clue">"{{ clue(id) }}"</span>
            </span>
          </button>
        }
      </cj-card>

      <div class="moves">
        <cj-button variant="ghost" [disabled]="!canMove(-1)" (click)="move(-1)">↑ subir</cj-button>
        <cj-button variant="ghost" [disabled]="!canMove(1)" (click)="move(1)">↓ descer</cj-button>
      </div>

      <cj-card class="ready">
        <p class="rc">{{ state().readyToReveal.length }} de {{ order().length }} prontos pra revelar</p>
        <cj-button
          [block]="true"
          [variant]="iAmReady() ? 'ghost' : 'primary'"
          (click)="toggleReady()"
        >
          {{ iAmReady() ? 'Ainda não…' : 'Pronto pra revelar' }}
        </cj-button>
      </cj-card>
    </cj-screen>
  `,
  styles: `
    header { text-align: center; }
    .tag {
      text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.64rem;
      color: var(--cj-game-accent); margin: 0 0 0.4rem;
    }
    h1 { font-size: 1.4rem; font-weight: 600; margin: 0; }
    .hint { font-size: 0.8rem; color: var(--cj-muted); margin: 0.4rem 0 0; }
    .board { display: flex; flex-direction: column; gap: 0.4rem; }
    .slot {
      display: flex; align-items: center; gap: 0.7rem; width: 100%;
      padding: 0.6rem 0.7rem; border-radius: 0.7rem; text-align: left;
      background: hsl(160 12% 13% / 0.55); border: 1px solid var(--cj-border);
      color: var(--cj-fg); font: inherit; cursor: pointer;
      transition: border-color var(--cj-dur), background var(--cj-dur);
    }
    .slot.sel { border-color: var(--cj-game-accent); background: color-mix(in srgb, var(--cj-game-accent) 12%, transparent); }
    .slot.self .nm::after { content: ' (você)'; color: var(--cj-muted); font-weight: 400; }
    .pos {
      font-family: var(--cj-font-display); font-weight: 700; font-size: 1.1rem;
      color: var(--cj-muted); width: 1.5rem; flex-shrink: 0; text-align: center;
    }
    .who { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .nm { font-weight: 500; }
    .clue { font-size: 0.78rem; color: var(--cj-muted); font-style: italic; word-break: break-word; }
    .moves { display: flex; gap: 0.5rem; }
    .moves cj-button { flex: 1; }
    .ready { display: flex; flex-direction: column; gap: 0.6rem; text-align: center; }
    .rc { margin: 0; font-size: 0.85rem; color: var(--cj-muted); }
  `,
})
export class ItoBoard {
  readonly state = input.required<ItoStateForPlayer>();

  private readonly store = inject(RoomStore);

  /** Cópia de trabalho da ordem: reseta quando o servidor manda um quadro novo. */
  protected readonly order = linkedSignal(() => this.state().board);
  protected readonly selected = signal<number | null>(null);

  protected readonly me = computed(() => this.store.mySessionId());
  protected readonly iAmReady = computed(() => this.state().readyToReveal.includes(this.me()));

  protected name(id: string): string {
    return this.store.players().find((p) => p.id === id)?.nickname ?? 'Jogador';
  }
  protected clue(id: string): string {
    return this.state().cards[id]?.clue ?? '…';
  }

  protected select(i: number): void {
    this.selected.set(this.selected() === i ? null : i);
  }

  protected canMove(dir: -1 | 1): boolean {
    const i = this.selected();
    return i !== null && i + dir >= 0 && i + dir < this.order().length;
  }

  protected move(dir: -1 | 1): void {
    const i = this.selected();
    if (i === null || !this.canMove(dir)) return;
    const next = [...this.order()];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    this.order.set(next);
    this.selected.set(i + dir);
    this.store.sendAction({ type: 'reorder_board', order: next });
  }

  protected toggleReady(): void {
    this.store.sendAction({ type: 'ready_to_reveal' });
  }
}
