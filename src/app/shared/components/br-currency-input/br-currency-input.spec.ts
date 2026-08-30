import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrCurrencyInput} from './br-currency-input';

// jsdom doesn't implement setSelectionRange — polyfill it
beforeAll(() => {
  HTMLInputElement.prototype.setSelectionRange = vi.fn() as unknown as (
    start: number,
    end: number,
    direction?: string,
  ) => void;
});

describe('BrCurrencyInput', () => {
  let component: BrCurrencyInput;
  let fixture: ComponentFixture<BrCurrencyInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrCurrencyInput],
    }).compileComponents();

    fixture = TestBed.createComponent(BrCurrencyInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with display value empty and not focused', () => {
    expect(component['displayValue']()).toBe('');
    expect(component['isFocused']()).toBe(false);
    expect(component['isDisabled']).toBe(false);
  });

  // ────────────────────────────
  //  writeValue (ControlValueAccessor)
  // ────────────────────────────

  it('should display a formatted value on writeValue', () => {
    component.writeValue(12.34);
    expect(component['displayValue']()).toBe('12,34');
  });

  it('should display empty on writeValue(0)', () => {
    component.writeValue(0);
    expect(component['displayValue']()).toBe('');
  });

  it('should display empty on writeValue(null)', () => {
    component.writeValue(null);
    expect(component['displayValue']()).toBe('');
  });

  it('should display empty on writeValue(undefined)', () => {
    component.writeValue(undefined);
    expect(component['displayValue']()).toBe('');
  });

  it('should format large numbers with Brazilian locale', () => {
    component.writeValue(1234.56);
    expect(component['displayValue']()).toBe('1.234,56');
  });

  // ────────────────────────────
  //  registerOnChange / registerOnTouched
  // ────────────────────────────

  it('should call onChange when internal value changes', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);

    const inputEvent = new InputEvent('input');
    Object.defineProperty(inputEvent, 'target', {
      value: {value: '150', setSelectionRange: vi.fn()},
    });

    component['onInput'](inputEvent);

    expect(onChange).toHaveBeenCalledWith(1.5);
  });

  it('should call onTouched on blur', () => {
    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);

    component['onBlur']();

    expect(onTouched).toHaveBeenCalled();
  });

  // ────────────────────────────
  //  setDisabledState
  // ────────────────────────────

  it('should disable the component', () => {
    component.setDisabledState(true);
    expect(component['isDisabled']).toBe(true);
  });

  it('should enable the component', () => {
    component.setDisabledState(false);
    expect(component['isDisabled']).toBe(false);
  });

  // ────────────────────────────
  //  onInput
  // ────────────────────────────

  it('should parse digits and format as BRL on input', () => {
    const inputEvent = new InputEvent('input');
    Object.defineProperty(inputEvent, 'target', {
      value: {value: '1234', setSelectionRange: vi.fn()},
    });

    component['onInput'](inputEvent);

    expect(component['displayValue']()).toBe('12,34');
  });

  it('should handle empty input', () => {
    const inputEvent = new InputEvent('input');
    Object.defineProperty(inputEvent, 'target', {
      value: {value: '', setSelectionRange: vi.fn()},
    });

    component['onInput'](inputEvent);

    expect(component['displayValue']()).toBe('');
    expect(component['centsValue']).toBe(0);
  });

  it('should strip non-digit characters from input', () => {
    const inputEvent = new InputEvent('input');
    Object.defineProperty(inputEvent, 'target', {
      value: {value: '12a3b4', setSelectionRange: vi.fn()},
    });

    component['onInput'](inputEvent);

    expect(component['centsValue']).toBe(1234);
    expect(component['displayValue']()).toBe('12,34');
  });

  // ────────────────────────────
  //  onKeydown — allow / block
  // ────────────────────────────

  it('should restore the cursor after input', async () => {
    const setSelectionRange = vi.fn();
    const inputEvent = new InputEvent('input');
    Object.defineProperty(inputEvent, 'target', {
      value: {value: '99', setSelectionRange},
    });
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    component['onInput'](inputEvent);
    expect(setSelectionRange).toHaveBeenCalled();
    raf.mockRestore();
  });

  it('should allow Backspace', () => {
    const event = new KeyboardEvent('keydown', {key: 'Backspace'});
    const preventDefault = vi.spyOn(event, 'preventDefault');
    component['onKeydown'](event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should allow Tab', () => {
    const event = new KeyboardEvent('keydown', {key: 'Tab'});
    const preventDefault = vi.spyOn(event, 'preventDefault');
    component['onKeydown'](event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should allow Ctrl+C', () => {
    const event = new KeyboardEvent('keydown', {key: 'c', ctrlKey: true});
    const preventDefault = vi.spyOn(event, 'preventDefault');
    component['onKeydown'](event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should allow Delete Escape Enter and meta shortcuts', () => {
    ['Delete', 'Escape', 'Enter'].forEach((key) => {
      const event = new KeyboardEvent('keydown', {key});
      const preventDefault = vi.spyOn(event, 'preventDefault');
      component['onKeydown'](event);
      expect(preventDefault).not.toHaveBeenCalled();
    });
    ['a', 'x'].forEach((key) => {
      const event = new KeyboardEvent('keydown', {key, metaKey: true});
      const preventDefault = vi.spyOn(event, 'preventDefault');
      component['onKeydown'](event);
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  it('should bind inputId to the inner input', () => {
    fixture.componentRef.setInput('inputId', 'valor');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#valor')).toBeTruthy();
  });

  it('should allow Ctrl+V', () => {
    const event = new KeyboardEvent('keydown', {key: 'v', ctrlKey: true});
    const preventDefault = vi.spyOn(event, 'preventDefault');
    component['onKeydown'](event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should allow arrow keys', () => {
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].forEach((key) => {
      const event = new KeyboardEvent('keydown', {key});
      const preventDefault = vi.spyOn(event, 'preventDefault');
      component['onKeydown'](event);
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  it('should block non-digit characters', () => {
    ['a', 'e', ',', '.', '-', ' '].forEach((key) => {
      const event = new KeyboardEvent('keydown', {key});
      const preventDefault = vi.spyOn(event, 'preventDefault');
      component['onKeydown'](event);
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  it('should allow digits', () => {
    ['0', '1', '9'].forEach((key) => {
      const event = new KeyboardEvent('keydown', {key});
      const preventDefault = vi.spyOn(event, 'preventDefault');
      component['onKeydown'](event);
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────
  //  onFocus / onBlur
  // ────────────────────────────

  it('should set isFocused on focus', () => {
    component['onFocus']();
    expect(component['isFocused']()).toBe(true);
  });

  it('should clear isFocused and call onTouched on blur', () => {
    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);
    component['onFocus']();
    expect(component['isFocused']()).toBe(true);

    component['onBlur']();
    expect(component['isFocused']()).toBe(false);
    expect(onTouched).toHaveBeenCalled();
  });

  // ────────────────────────────
  //  Full cycle: write → edit → blur
  // ────────────────────────────

  it('should use default ControlValueAccessor stubs', () => {
    const inputEvent = new InputEvent('input');
    Object.defineProperty(inputEvent, 'target', {
      value: {value: '10', setSelectionRange: vi.fn()},
    });
    expect(() => component['onInput'](inputEvent)).not.toThrow();
    expect(() => component['onBlur']()).not.toThrow();
  });

  it('should handle native input events from the template', () => {
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.value = '250';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new KeyboardEvent('keydown', {key: '1', bubbles: true}));
    input.blur();
    fixture.detectChanges();
    expect(component['isFocused']()).toBe(false);
  });

  it('should restore formatted value on blur', () => {
    // Write a value, then simulate editing without changing, then blur
    component.writeValue(5.0);
    expect(component['displayValue']()).toBe('5,00');

    component['onBlur']();
    expect(component['displayValue']()).toBe('5,00');
  });
});
