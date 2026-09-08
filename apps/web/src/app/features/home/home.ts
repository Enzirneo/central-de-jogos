import { Component } from '@angular/core';

/**
 * Placeholder do scaffold. As telas de verdade (criar/entrar, lobby, jogo)
 * entram nas próximas branches da Fase 2.
 */
@Component({
  selector: 'app-home',
  template: `
    <main class="home">
      <p class="tag">Central de Jogos</p>
      <h1>web scaffold no ar</h1>
      <p class="sub">Angular {{ angularReady }} · pronto para o design system e as telas.</p>
    </main>
  `,
  styles: `
    .home {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      text-align: center;
      padding: 2rem;
    }
    .tag {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.7rem;
      color: hsl(152 22% 56%);
      margin: 0;
    }
    h1 {
      font-size: clamp(1.8rem, 5vw, 2.6rem);
      font-weight: 600;
      margin: 0.25rem 0;
    }
    .sub {
      color: hsl(150 8% 58%);
      margin: 0;
    }
  `,
})
export class Home {
  protected readonly angularReady = '20';
}
