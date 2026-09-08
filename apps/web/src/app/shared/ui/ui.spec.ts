import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, RoomCode, Badge, PlayerChip } from './index';

@Component({
  imports: [Button, RoomCode, Badge, PlayerChip],
  template: `
    <cj-button>Criar</cj-button>
    <cj-button variant="ghost">Voltar</cj-button>
    <cj-room-code code="WXYZ" />
    <cj-badge variant="live">aberta</cj-badge>
    <cj-player-chip name="ana" [host]="true" />
  `,
})
class Host {}

describe('componentes de UI', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('cj-button primário mostra a seta; ghost não', () => {
    const el = render();
    const [primary, ghost] = el.querySelectorAll('cj-button button');
    expect(primary.querySelector('.arw')).toBeTruthy();
    expect(ghost.querySelector('.arw')).toBeNull();
    expect(ghost.getAttribute('data-variant')).toBe('ghost');
  });

  it('cj-room-code renderiza o código em bloco único', () => {
    const el = render();
    const code = el.querySelector('cj-room-code .code');
    expect(code?.textContent?.trim()).toBe('WXYZ');
    expect(el.querySelectorAll('cj-room-code .code').length).toBe(1);
  });

  it('cj-badge live tem a bolinha de status', () => {
    const el = render();
    const badge = el.querySelector('cj-badge');
    expect(badge?.getAttribute('data-variant')).toBe('live');
    expect(badge?.querySelector('.dot')).toBeTruthy();
  });

  it('cj-player-chip usa a inicial maiúscula e marca o host', () => {
    const el = render();
    const chip = el.querySelector('cj-player-chip');
    expect(chip?.querySelector('.av')?.textContent?.trim()).toBe('A');
    expect(chip?.querySelector('.crown')).toBeTruthy();
  });
});
