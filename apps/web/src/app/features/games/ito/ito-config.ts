import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RoomStore } from '../../../core/colyseus/room.store';
import { Button, Card } from '../../../shared/ui';
import type { ItoRoundsConfig, ItoStartOptions } from './ito.types';

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;
const DEFAULT: ItoStartOptions = { mode: 'consensus', rounds: { type: 'fixed', totalRounds: 5 } };

/**
 * Config pré-jogo do ITO, na tela de "pronto". Só o host edita; os outros veem
 * o resumo. Cada mudança manda o objeto inteiro via `store.setGameOptions`.
 */
@Component({
  selector: 'app-ito-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card],
  host: { style: '--cj-game-accent: hsl(190 75% 55%)' },
  template: `
    <cj-card class="cfg">
      @if (store.isHost()) {
        <div class="group">
          <p class="label">Como pontua</p>
          <div class="opts">
            <button [class.on]="opts().mode === 'consensus'" (click)="setMode('consensus')">
              <strong>Em equipe</strong>
              <span>uma ordem só, todo mundo acerta ou erra junto</span>
            </button>
            <button [class.on]="opts().mode === 'individual'" (click)="setMode('individual')">
              <strong>Cada um por si</strong>
              <span>cada um faz a sua ordem, ganha ponto quem acertar</span>
            </button>
          </div>
        </div>

        <div class="group">
          <p class="label">Rodadas</p>
          <div class="rounds">
            <cj-button variant="ghost" [disabled]="endless() || total() <= 1" (click)="bump(-1)">−</cj-button>
            <span class="n">{{ endless() ? '∞' : total() }}</span>
            <cj-button variant="ghost" [disabled]="endless() || total() >= 20" (click)="bump(1)">+</cj-button>
            <label class="sw">
              <input type="checkbox" [checked]="endless()" (change)="toggleEndless($any($event.target).checked)" />
              sem fim
            </label>
          </div>
        </div>
      } @else {
        <p class="ro">Modo: <strong>{{ modeLabel() }}</strong> · {{ endless() ? 'sem fim' : total() + ' rodada(s)' }}</p>
      }
    </cj-card>
  `,
  styles: `
    .cfg { display: flex; flex-direction: column; gap: 1rem; }
    .label {
      font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.14em;
      color: var(--cj-muted); margin: 0 0 0.5rem;
    }
    .opts { display: flex; flex-direction: column; gap: 0.5rem; }
    .opts button {
      display: flex; flex-direction: column; gap: 0.15rem; text-align: left;
      padding: 0.7rem; border-radius: 0.7rem; font: inherit; cursor: pointer;
      background: hsl(160 12% 13% / 0.5); border: 1px solid var(--cj-border); color: var(--cj-fg);
    }
    .opts button.on {
      border-color: var(--cj-game-accent);
      background: color-mix(in srgb, var(--cj-game-accent) 12%, transparent);
    }
    .opts span { font-size: 0.75rem; color: var(--cj-muted); }
    .rounds { display: flex; align-items: center; gap: 0.6rem; }
    .rounds .n {
      font-family: var(--cj-font-display); font-size: 1.3rem; font-weight: 700;
      min-width: 2ch; text-align: center;
    }
    .sw { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--cj-muted); margin-left: auto; }
    .ro { margin: 0; font-size: 0.9rem; color: var(--cj-muted); }
  `,
})
export class ItoConfig {
  protected readonly store = inject(RoomStore);

  protected readonly opts = computed<ItoStartOptions>(() => {
    const raw = this.store.pendingGameOptions() as Partial<ItoStartOptions> | null;
    return {
      mode: raw?.mode === 'individual' ? 'individual' : 'consensus',
      rounds: raw?.rounds ?? DEFAULT.rounds,
    };
  });

  protected readonly endless = computed(() => this.opts().rounds.type === 'endless');
  protected readonly total = computed(() => {
    const r = this.opts().rounds;
    return r.type === 'fixed' ? r.totalRounds : 5;
  });
  protected readonly modeLabel = computed(() =>
    this.opts().mode === 'individual' ? 'Cada um por si' : 'Em equipe',
  );

  protected setMode(mode: ItoStartOptions['mode']): void {
    this.store.setGameOptions({ ...this.opts(), mode });
  }

  protected bump(delta: number): void {
    const next = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, this.total() + delta));
    this.store.setGameOptions({ ...this.opts(), rounds: { type: 'fixed', totalRounds: next } });
  }

  protected toggleEndless(on: boolean): void {
    const rounds: ItoRoundsConfig = on
      ? { type: 'endless' }
      : { type: 'fixed', totalRounds: this.total() };
    this.store.setGameOptions({ ...this.opts(), rounds });
  }
}
