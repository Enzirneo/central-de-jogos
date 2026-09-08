import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RoomStore } from '../../core/colyseus/room.store';
import { Button, Card, Screen, TextField } from '../../shared/ui';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Screen, TextField],
  template: `
    <cj-screen [center]="true">
      <header>
        <p class="tag">Central de Jogos</p>
        <h1>Jogue com a galera,<br />cada um no seu celular</h1>
      </header>

      <cj-card class="stack">
        <cj-text-field
          label="Seu apelido"
          placeholder="Ana"
          autocapitalize="words"
          [maxlength]="20"
          [(value)]="nickname"
        />
        <cj-button [block]="true" [disabled]="busy() || !nickname().trim()" (click)="create()">
          Criar uma sala
        </cj-button>
      </cj-card>

      <div class="or">ou entrar com código</div>

      <cj-card class="stack">
        <cj-text-field
          label="Código da sala"
          placeholder="ABCD"
          autocapitalize="characters"
          inputmode="latin"
          [maxlength]="4"
          [(value)]="code"
        />
        <cj-button
          variant="ghost"
          [block]="true"
          [disabled]="busy() || code().trim().length < 4 || !nickname().trim()"
          (click)="join()"
        >
          Entrar
        </cj-button>
      </cj-card>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
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
      margin: 0 0 0.5rem;
    }
    h1 {
      font-size: clamp(1.6rem, 5.5vw, 2.2rem);
      font-weight: 600;
      line-height: 1.15;
      margin: 0;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .or {
      text-align: center;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--cj-muted);
    }
    .error {
      color: var(--cj-danger);
      text-align: center;
      font-size: 0.9rem;
      margin: 0;
    }
  `,
})
export class Home {
  private readonly store = inject(RoomStore);
  private readonly router = inject(Router);

  protected readonly nickname = signal(loadNickname());
  protected readonly code = signal('');
  protected readonly error = this.store.error;
  protected readonly busy = computed(() => this.store.connecting());

  constructor() {
    // conectou numa sala -> vai pra tela da sala
    effect(() => {
      if (this.store.connected()) {
        this.router.navigate(['/sala']);
      }
    });
    effect(() => saveNickname(this.nickname()));
  }

  protected create(): void {
    void this.store.create(this.nickname().trim());
  }

  protected join(): void {
    void this.store.join(this.code().trim(), this.nickname().trim());
  }
}

const NICK_KEY = 'cj.nickname';
function loadNickname(): string {
  try {
    return localStorage.getItem(NICK_KEY) ?? '';
  } catch {
    return '';
  }
}
function saveNickname(value: string): void {
  try {
    localStorage.setItem(NICK_KEY, value);
  } catch {
    /* noop */
  }
}
