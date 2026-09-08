import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Botão da Central. `primary` = gradiente + glow; `ghost` = contorno de vidro. */
@Component({
  selector: 'cj-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled()" [attr.data-variant]="variant()" [class.block]="block()">
      <ng-content />
      @if (variant() === 'primary') {
        <span class="arw" aria-hidden="true">→</span>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    :host(.full),
    button.block {
      width: 100%;
    }
    button {
      font: inherit;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.35rem;
      border-radius: var(--cj-radius-pill);
      border: 1px solid transparent;
      color: var(--cj-fg);
      transition: transform var(--cj-dur) var(--cj-ease), box-shadow var(--cj-dur) var(--cj-ease),
        border-color var(--cj-dur) var(--cj-ease), opacity var(--cj-dur);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button[data-variant='primary'] {
      background-image: var(--cj-gradient-primary);
      color: var(--cj-primary-fg);
      box-shadow: var(--cj-shadow-glow);
    }
    button[data-variant='primary']:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 34px -8px hsl(152 22% 56% / 0.45);
    }
    button[data-variant='ghost'] {
      background: hsl(160 14% 9% / 0.6);
      border-color: var(--cj-border);
      backdrop-filter: blur(8px);
    }
    button[data-variant='ghost']:not(:disabled):hover {
      border-color: hsl(152 22% 56% / 0.45);
    }
    .arw {
      transition: transform var(--cj-dur) var(--cj-ease);
    }
    button:not(:disabled):hover .arw {
      transform: translateX(4px);
    }
  `,
})
export class Button {
  readonly variant = input<'primary' | 'ghost'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly block = input(false);
}
