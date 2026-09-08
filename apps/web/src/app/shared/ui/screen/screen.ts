import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Moldura de tela: ocupa a viewport, fundo "hero" com grade sutil, e uma
 * coluna central estreita (cada jogador no próprio celular). O conteúdo
 * projetado é o miolo da tela.
 */
@Component({
  selector: 'cj-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid" aria-hidden="true"></div>
    <div class="inner" [class.center]="center()">
      <ng-content />
    </div>
  `,
  styles: `
    @use 'styles/mixins' as m;
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--cj-gradient-hero);
      position: relative;
      overflow-x: hidden;
    }
    .grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.5;
      @include m.grid-bg(38px);
    }
    .inner {
      position: relative;
      max-width: 460px;
      margin: 0 auto;
      padding: clamp(1.25rem, 5vw, 2rem);
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      min-height: 100dvh;
    }
    .inner.center {
      justify-content: center;
    }
  `,
})
export class Screen {
  readonly center = input(false);
}
