import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Código da sala em destaque — bloco único, entra com um "flip". */
@Component({
  selector: 'cj-room-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="label">código da sala</span>
    <span class="code">{{ code() }}</span>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
    }
    .label {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.62rem;
      color: var(--cj-muted);
    }
    .code {
      font-family: var(--cj-font-display);
      font-weight: 600;
      font-size: 2rem;
      letter-spacing: 0.1em;
      padding: 0.7rem 1.4rem;
      border-radius: 1rem;
      background: hsl(160 14% 9% / 0.85);
      border: 1px solid hsl(152 22% 56% / 0.32);
      box-shadow: inset 0 0 24px hsl(152 22% 56% / 0.1), var(--cj-shadow-glow);
      animation: flip 0.5s var(--cj-ease) both;
    }
    @keyframes flip {
      from {
        opacity: 0;
        transform: rotateX(-70deg) translateY(6px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .code {
        animation-duration: 0.001ms;
      }
    }
  `,
})
export class RoomCode {
  readonly code = input.required<string>();
}
