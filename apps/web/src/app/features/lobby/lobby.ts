import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GAME_CATALOG, type GameCatalogEntry } from '@central-de-jogos/protocol';
import { RoomStore } from '../../core/colyseus/room.store';
import { Badge, Button, Card, PlayerChip, RoomCode, Screen } from '../../shared/ui';

@Component({
  selector: 'app-lobby',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Button, Card, PlayerChip, RoomCode, Screen],
  template: `
    <cj-screen>
      <cj-card class="code-card">
        <cj-room-code [code]="store.code()" />
        <p class="hint">Passe o código pra galera entrar em central-de-jogos</p>
      </cj-card>

      <cj-card class="stack">
        <div class="row">
          <span class="count">{{ store.players().length }} jogador(es)</span>
          <cj-badge variant="live">sala aberta</cj-badge>
        </div>
        @for (p of store.players(); track p.id) {
          <cj-player-chip
            [name]="p.nickname"
            [host]="p.id === store.hostId()"
            [connected]="p.connected"
          />
        }
      </cj-card>

      @if (store.isHost()) {
        <cj-card class="stack">
          <p class="section">Escolha um jogo</p>
          @for (g of catalog; track g.id) {
            <button
              class="game"
              type="button"
              [style.--gc]="g.accent"
              [disabled]="!fits(g)"
              (click)="pick(g)"
            >
              <span class="ic">{{ g.icon }}</span>
              <span class="txt">
                <span class="nm">{{ g.displayName }}</span>
                <span class="mt">
                  {{ g.minPlayers }}–{{ g.maxPlayers }} jogadores · {{ g.tagline }}
                  @if (!fits(g)) {
                    <span class="warn"> — precisa de {{ g.minPlayers }} a {{ g.maxPlayers }}</span>
                  }
                </span>
              </span>
            </button>
          }
        </cj-card>
      } @else {
        <cj-card class="waiting">
          Aguardando <strong>{{ hostName() }}</strong> escolher um jogo…
        </cj-card>
      }

      @if (store.error()) {
        <p class="error" role="alert">{{ store.error() }}</p>
      }

      <cj-button variant="ghost" [block]="true" (click)="leave()">Sair da sala</cj-button>
    </cj-screen>
  `,
  styles: `
    .code-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }
    .hint {
      font-size: 0.8rem;
      color: var(--cj-muted);
      margin: 0;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .count {
      font-size: 0.85rem;
      color: var(--cj-muted);
    }
    .section {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--cj-muted);
      margin: 0 0 0.15rem;
    }
    .game {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-align: left;
      padding: 0.8rem;
      border-radius: 0.85rem;
      background: hsl(160 12% 12% / 0.6);
      border: 1px solid var(--cj-border);
      color: var(--cj-fg);
      font: inherit;
      cursor: pointer;
      transition:
        transform var(--cj-dur) var(--cj-ease),
        border-color var(--cj-dur),
        box-shadow var(--cj-dur);
    }
    .game:not(:disabled):hover {
      transform: translateY(-2px);
      border-color: var(--gc);
      box-shadow: 0 10px 30px -12px var(--gc);
    }
    .game:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .ic {
      width: 40px;
      height: 40px;
      border-radius: 0.7rem;
      display: grid;
      place-items: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      background: color-mix(in srgb, var(--gc) 18%, transparent);
      border: 1px solid color-mix(in srgb, var(--gc) 40%, transparent);
    }
    .txt {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .nm {
      font-family: var(--cj-font-display);
      font-weight: 500;
    }
    .mt {
      font-size: 0.72rem;
      color: var(--cj-muted);
    }
    .warn {
      color: var(--cj-warning);
    }
    .waiting {
      text-align: center;
      color: var(--cj-muted);
      font-size: 0.92rem;
    }
    .error {
      color: var(--cj-danger);
      text-align: center;
      font-size: 0.9rem;
      margin: 0;
    }
  `,
})
export class Lobby {
  protected readonly store = inject(RoomStore);
  protected readonly catalog = GAME_CATALOG;

  protected readonly hostName = computed(
    () => this.store.players().find((p) => p.id === this.store.hostId())?.nickname ?? 'o host',
  );

  protected fits(g: GameCatalogEntry): boolean {
    const n = this.store.players().length;
    return n >= g.minPlayers && n <= g.maxPlayers;
  }

  protected pick(g: GameCatalogEntry): void {
    this.store.clearError();
    this.store.selectGame(g.id);
  }

  protected leave(): void {
    this.store.leave();
  }
}
