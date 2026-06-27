import {Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

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
    <div class="currency-wrapper" [class.focused]="isFocused()" [class.disabled]="isDisabled" [class.has-value]="displayValue() !== ''">
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
        [placeholder]="placeholder()"
        [disabled]="isDisabled"
      />
    </div>
  `,
  styleUrl: './br-currency-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BrCurrencyInput),
      multi: true,
    },
  ],
})
export class BrCurrencyInput implements ControlValueAccessor {
  placeholder = input('0,00');

  private centsValue = 0;
  protected displayValue = signal('');
  protected isFocused = signal(false);
  protected isDisabled = false;

  // These stubs are replaced by registerOnChange / registerOnTouched — required by ControlValueAccessor.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: number) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ---

  writeValue(value: number | null | undefined): void {
    const num = value ?? 0;
    this.centsValue = Math.round(num * 100);
    this.updateDisplay();
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // --- Event handlers ---

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 11);

    this.centsValue = raw ? parseInt(raw, 10) : 0;
    this.updateDisplay();
    this.emitChange();

    // Restore cursor to end after value update
    requestAnimationFrame(() => {
      const len = this.displayValue().length;
      input.setSelectionRange(len, len);
    });
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    // When focusing, show the raw cents value for clean editing
    this.updateDisplay();
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.updateDisplay();
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Allow control keys
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(event.key)
    ) {
      return;
    }

    // Allow Ctrl/Cmd + shortcuts
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())
    ) {
      return;
    }

    // Allow navigation
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
    ) {
      return;
    }

    // Only allow digits
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // --- Internal helpers ---

  private updateDisplay(): void {
    if (this.centsValue === 0) {
      this.displayValue.set('');
      return;
    }

    const reais = Math.floor(this.centsValue / 100);
    const centavos = this.centsValue % 100;

    // Brazilian format: 1.234,56
    const formattedReais = reais.toLocaleString('pt-BR');
    this.displayValue.set(
      `${formattedReais},${centavos.toString().padStart(2, '0')}`
    );
  }

  private emitChange(): void {
    this.onChange(this.centsValue / 100);
  }
}
