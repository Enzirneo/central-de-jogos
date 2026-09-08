import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Etiqueta pequena. `live` = verde com bolinha pulsando. */
@Component({
  selector: 'cj-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dot() || variant() === 'live') {
      <span class="dot" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: var(--cj-radius-pill);
      padding: 0.25rem 0.7rem;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      border: 1px solid var(--cj-border);
      color: var(--cj-muted);
    }
    :host([data-variant='live']) {
      color: var(--cj-success);
      border-color: hsl(142 60% 45% / 0.35);
      background: hsl(142 60% 45% / 0.12);
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,
      100% {
        opacity: 0.5;
        box-shadow: 0 0 0 0 currentColor;
      }
      50% {
        opacity: 1;
        box-shadow: 0 0 0 4px transparent;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot {
        animation: none;
      }
    }
  `,
  host: { '[attr.data-variant]': 'variant()' },
})
export class Badge {
  readonly variant = input<'neutral' | 'live'>('neutral');
  readonly dot = input(false);
}
