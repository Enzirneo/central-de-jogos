import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { findCatalogEntry } from '@central-de-jogos/protocol';
import { RoomStore } from '../../core/colyseus/room.store';
import { Card, Screen } from '../../shared/ui';

/**
 * Placeholder. A branch feat/web-game-host troca isto por um container que
 * carrega o componente do jogo ativo por um registry (espelhando o
 * registry.ts do servidor).
 */
@Component({
  selector: 'app-game-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Screen, JsonPipe],
  template: `
    <cj-screen>
      <cj-card>
        <p class="hd">{{ game()?.icon }} {{ game()?.displayName }} em andamento</p>
        <pre>{{ store.gameState() | json }}</pre>
      </cj-card>
    </cj-screen>
  `,
  styles: `
    .hd {
      font-family: var(--cj-font-display);
      margin: 0 0 0.75rem;
    }
    pre {
      font-size: 0.75rem;
      color: var(--cj-muted);
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
  `,
})
export class GameHost {
  protected readonly store = inject(RoomStore);
  protected readonly game = () => findCatalogEntry(this.store.activeGameId());
}
