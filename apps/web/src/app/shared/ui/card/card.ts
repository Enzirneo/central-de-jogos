import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Superfície padrão da UI — cartão de vidro fosco. */
@Component({
  selector: 'cj-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: `
    @use 'styles/mixins' as m;
    :host {
      display: block;
      padding: 1.25rem;
      @include m.glass;
    }
  `,
})
export class Card {}
