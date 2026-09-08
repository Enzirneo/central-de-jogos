import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RoomStore } from '../../core/colyseus/room.store';
import { loadGameComponent } from '../../core/colyseus/game-registry';
import { Card, Screen } from '../../shared/ui';

/**
 * Mostra o componente do jogo ativo, carregado por id via `game-registry`
 * (espelha `apps/server/src/games/registry.ts` — a Central nunca importa um
 * jogo direto). A tela de resultados fica em `features/results/`.
 */
@Component({
  selector: 'app-game-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, Card, Screen],
  template: `
    @if (component(); as cmp) {
      <ng-container [ngComponentOutlet]="cmp" />
    } @else if (failed()) {
      <cj-screen [center]="true">
        <cj-card>Não foi possível carregar o jogo "{{ store.activeGameId() }}".</cj-card>
      </cj-screen>
    }
  `,
})
export class GameHost {
  protected readonly store = inject(RoomStore);

  protected readonly component = signal<Type<unknown> | null>(null);
  protected readonly failed = signal(false);
  private readonly loadedFor = signal('');

  protected readonly needsLoad = computed(() => {
    const id = this.store.activeGameId();
    return id && id !== this.loadedFor() ? id : null;
  });

  constructor() {
    effect(() => {
      const id = this.needsLoad();
      if (id) void this.load(id);
    });
  }

  private async load(gameId: string): Promise<void> {
    this.loadedFor.set(gameId);
    this.failed.set(false);
    this.component.set(null);
    try {
      const cmp = await loadGameComponent(gameId);
      this.component.set(cmp ?? null);
      this.failed.set(!cmp);
    } catch {
      this.failed.set(true);
    }
  }
}
