import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Linha de um jogador na sala. Entra com pop-in. */
@Component({
  selector: 'cj-player-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="av" [style.background]="avatarBg()" [style.color]="accent() ?? 'var(--cj-glow)'">
      {{ initial() }}
    </span>
    <span class="name" [class.dim]="!connected()">{{ name() }}</span>
    @if (host()) {
      <span class="crown" title="host" aria-label="host">👑</span>
    }
    <span class="status" [class.ready]="ready()">
      @if (!connected()) {
        caiu
      } @else if (ready()) {
        pronto
      } @else {
        na sala
      }
    </span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.7rem;
      border-radius: 0.75rem;
      background: hsl(160 12% 13% / 0.55);
      border: 1px solid hsl(160 12% 16% / 0.7);
      font-size: 0.9rem;
      animation: cj-rise 0.5s var(--cj-ease) both;
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation-duration: 0.001ms;
      }
    }
    .av {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .name.dim {
      color: var(--cj-muted);
    }
    .crown {
      font-size: 0.7rem;
    }
    .status {
      margin-left: auto;
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--cj-muted);
    }
    .status.ready {
      color: var(--cj-success);
    }
  `,
})
export class PlayerChip {
  readonly name = input.required<string>();
  readonly accent = input<string | null>(null);
  readonly host = input(false);
  readonly ready = input(false);
  readonly connected = input(true);

  protected readonly initial = computed(() => this.name().trim().charAt(0).toUpperCase() || '?');
  protected readonly avatarBg = computed(() => {
    const c = this.accent() ?? 'var(--cj-primary)';
    return `color-mix(in srgb, ${c} 26%, transparent)`;
  });
}
