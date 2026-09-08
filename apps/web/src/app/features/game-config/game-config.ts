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
import { loadGameConfigComponent } from '../../core/colyseus/game-registry';

/**
 * Mostra a tela de config do jogo proposto (se ele tiver uma), carregada pelo
 * `game-registry`. Aparece na tela de "pronto". A Central não conhece a config
 * de nenhum jogo — só pergunta ao registro.
 */
@Component({
  selector: 'app-game-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    @if (component(); as cmp) {
      <ng-container [ngComponentOutlet]="cmp" />
    }
  `,
})
export class GameConfig {
  private readonly store = inject(RoomStore);
  protected readonly component = signal<Type<unknown> | null>(null);
  private readonly loadedFor = signal('');

  private readonly needsLoad = computed(() => {
    const id = this.store.pendingGameId();
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
    this.component.set((await loadGameConfigComponent(gameId)) ?? null);
  }
}
