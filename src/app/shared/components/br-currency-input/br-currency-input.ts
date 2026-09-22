import {Component, effect, input, model, signal} from '@angular/core';
import {FormValueControl} from '@angular/forms/signals';

/**
 * Brazilian currency input component (R$)
 *
 * Typing "120" displays "R$ 1,20" and provides value 1.20 to the form.
 * Uses Brazilian number format: R$ 1.234,56
 */
@Component({
  selector: 'app-br-currency-input',
  imports: [],
  template: `
    <div
      class="currency-wrapper"
      [class.focused]="isFocused()"
      [class.disabled]="disabled()"
      [class.has-value]="displayValue() !== ''"
    >
      <span class="currency-prefix">R$</span>
      <input
        class="currency-input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        [value]="displayValue()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
        [attr.id]="inputId() || null"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
      />
    </div>
  `,
  styleUrl: './br-currency-input.scss',
})
export class BrCurrencyInput implements FormValueControl<number | null> {
  placeholder = input('0,00');
  inputId = input('');

  readonly value = model<number | null>(null);
  readonly touched = model(false);
  readonly disabled = input(false);

  private centsValue = 0;
  protected displayValue = signal('');
  protected isFocused = signal(false);

  constructor() {
    effect(() => {
      if (this.isFocused()) {
        return;
      }
      const num = this.value();
      this.centsValue = num == null ? 0 : Math.round(num * 100);
      this.updateDisplay();
    });
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 11);

    this.centsValue = raw ? parseInt(raw, 10) : 0;
    this.updateDisplay();
    this.emitChange();

    requestAnimationFrame(() => {
      const len = this.displayValue().length;
      input.setSelectionRange(len, len);
    });
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.updateDisplay();
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.touched.set(true);
    this.updateDisplay();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(event.key)
    ) {
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())
    ) {
      return;
    }

    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private updateDisplay(): void {
    if (this.centsValue === 0) {
      this.displayValue.set('');
      return;
    }

    const reais = Math.floor(this.centsValue / 100);
    const centavos = this.centsValue % 100;
    const formattedReais = reais.toLocaleString('pt-BR');
    this.displayValue.set(
      `${formattedReais},${centavos.toString().padStart(2, '0')}`,
    );
  }

  private emitChange(): void {
    this.value.set(this.centsValue === 0 ? null : this.centsValue / 100);
  }
}
