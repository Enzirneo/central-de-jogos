import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { findCatalogEntry } from '@central-de-jogos/protocol';
import { RoomStore } from '../../core/colyseus/room.store';
import { Button, Card, PlayerChip, Screen } from '../../shared/ui';

@Component({
  selector: 'app-ready-check',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, PlayerChip, Screen],
  template: `
    <cj-screen [center]="true">
      <header>
        <span class="ic">{{ game()?.icon ?? '🎮' }}</span>
        <h1>{{ game()?.displayName ?? 'Jogo' }}</h1>
        <p class="sub">Todo mundo pronto e o jogo começa.</p>
      </header>

      <cj-card class="stack">
        @for (p of store.players(); track p.id) {
          <cj-player-chip
            [name]="p.nickname"
            [host]="p.id === store.hostId()"
            [ready]="p.ready"
            [connected]="p.connected"
          />
        }
        <p class="tally">{{ readyCount() }} de {{ store.players().length }} prontos</p>
      </cj-card>

      <cj-button
        [block]="true"
        [variant]="iAmReady() ? 'ghost' : 'primary'"
        (click)="store.toggleReady()"
      >
        {{ iAmReady() ? 'Ainda não…' : 'Estou pronto' }}
      </cj-button>

      @if (store.isHost()) {
        <cj-button variant="ghost" [block]="true" (click)="store.cancelStart()">
          Cancelar e voltar ao lobby
        </cj-button>
      }
    </cj-screen>
  `,
  styles: `
    header {
      text-align: center;
    }
    .ic {
      font-size: 2rem;
    }
    h1 {
      font-size: clamp(1.5rem, 4.5vw, 2rem);
      font-weight: 600;
      margin: 0.35rem 0 0.2rem;
    }
    .sub {
      color: var(--cj-muted);
      margin: 0;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .tally {
      text-align: center;
      font-size: 0.8rem;
      color: var(--cj-muted);
      margin: 0.25rem 0 0;
    }
  `,
})
export class ReadyCheck {
  protected readonly store = inject(RoomStore);

  protected readonly game = computed(() => findCatalogEntry(this.store.pendingGameId()));
  protected readonly iAmReady = computed(() => this.store.me()?.ready ?? false);
  protected readonly readyCount = computed(
    () => this.store.players().filter((p) => p.ready).length,
  );
}
