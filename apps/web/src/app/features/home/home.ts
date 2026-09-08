import { ChangeDetectionStrategy, Component, viewChild, ElementRef, signal } from '@angular/core';
import { Button, Card, RoomCode, Badge, PlayerChip, TextField, Screen, burstConfetti } from '../../shared/ui';

/**
 * Vitrine do design system (temporária). As telas de verdade — criar/entrar,
 * lobby, jogo, resultados — entram nas próximas branches da Fase 2.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, RoomCode, Badge, PlayerChip, TextField, Screen],
  template: `
    <cj-screen>
      <header>
        <p class="tag">Central de Jogos</p>
        <h1>Design system no ar</h1>
        <p class="sub">Componentes-base prontos. Próximo: as telas.</p>
      </header>

      <cj-card>
        <cj-room-code code="ABCD" />
      </cj-card>

      <cj-card class="stack">
        <cj-text-field
          label="Seu apelido"
          placeholder="Ana"
          [maxlength]="20"
          [(value)]="nickname"
        />
        <cj-button [block]="true">Criar uma sala</cj-button>
        <cj-button variant="ghost" [block]="true">Entrar por código</cj-button>
      </cj-card>

      <cj-card class="stack">
        <div class="row">
          <cj-badge variant="live">aberta</cj-badge>
          <cj-badge>aguardando</cj-badge>
        </div>
        <cj-player-chip name="Ana" [host]="true" [ready]="true" />
        <cj-player-chip name="Beto" accent="hsl(190 75% 55%)" />
        <cj-player-chip name="Cau" accent="hsl(320 62% 62%)" [connected]="false" />
      </cj-card>

      <cj-card class="win">
        <canvas #confetti></canvas>
        <span>🏆 Você venceu!</span>
        <cj-button (click)="celebrate()">Soltar confete</cj-button>
      </cj-card>
    </cj-screen>
  `,
  styles: `
    header {
      text-align: center;
    }
    .tag {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.68rem;
      color: var(--cj-glow);
      margin: 0;
    }
    h1 {
      font-size: clamp(1.7rem, 5vw, 2.3rem);
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
      gap: 0.75rem;
    }
    .row {
      display: flex;
      gap: 0.5rem;
    }
    .win {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.9rem;
      text-align: center;
      font-family: var(--cj-font-display);
    }
    .win canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
  `,
})
export class Home {
  protected readonly nickname = signal('');
  private readonly confetti = viewChild<ElementRef<HTMLCanvasElement>>('confetti');

  protected celebrate(): void {
    const el = this.confetti()?.nativeElement;
    if (el) burstConfetti(el);
  }
}
