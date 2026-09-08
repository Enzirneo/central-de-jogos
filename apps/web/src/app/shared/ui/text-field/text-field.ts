import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let uid = 0;

/**
 * Campo de texto rotulado. Use com `[(value)]`. Para uso futuro em formulários
 * reativos, dá para implementar ControlValueAccessor sem mudar o template.
 */
@Component({
  selector: 'cj-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [for]="id">{{ label() }}</label>
    <input
      [id]="id"
      [value]="value()"
      [placeholder]="placeholder()"
      [attr.maxlength]="maxlength()"
      [attr.inputmode]="inputmode()"
      [attr.autocapitalize]="autocapitalize()"
      (input)="value.set($any($event.target).value)"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--cj-muted);
    }
    input {
      font: inherit;
      color: var(--cj-fg);
      background: hsl(160 14% 9% / 0.7);
      border: 1px solid var(--cj-border);
      border-radius: 0.75rem;
      padding: 0.7rem 0.85rem;
      outline: none;
      transition: border-color var(--cj-dur);
    }
    input:focus-visible {
      border-color: hsl(152 22% 56% / 0.55);
    }
    input::placeholder {
      color: hsl(150 8% 42%);
    }
  `,
})
export class TextField {
  readonly label = input('');
  readonly placeholder = input('');
  readonly maxlength = input<number | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly autocapitalize = input<string | null>(null);
  readonly value = model('');
  protected readonly id = `cj-field-${uid++}`;
}
