import {appConfig} from './app.config';

describe('appConfig', () => {
  it('should provide configuration with at least 4 providers', () => {
    expect(appConfig).toBeTruthy();
    expect(appConfig.providers).toBeTruthy();
    expect(appConfig.providers.length).toBeGreaterThanOrEqual(4);
  });

  it('should have a signal forms config provider with CSS class callbacks', () => {
    // provideSignalFormsConfig returns [{ provide: SIGNAL_FORMS_CONFIG, useValue: config }]
    // So we search for an array item that contains the classes config
    let classes: Record<string, (f: { state: () => Record<string, () => boolean> }) => boolean> | undefined;

    for (const provider of appConfig.providers) {
      if (Array.isArray(provider)) {
        for (const inner of provider) {
          if (
            inner &&
            typeof inner === 'object' &&
            'useValue' in inner &&
            (inner as { useValue: Record<string, unknown> }).useValue &&
            typeof (inner as { useValue: Record<string, unknown> }).useValue === 'object' &&
            'classes' in (inner as { useValue: Record<string, unknown> }).useValue
          ) {
            classes = (inner as { useValue: { classes: Record<string, (f: { state: () => Record<string, () => boolean> }) => boolean> } }).useValue.classes;
            break;
          }
        }
      }
      if (classes) break;
    }

    expect(classes).toBeTruthy();

    const mockField = (state: Record<string, boolean>) => ({
      state: () => Object.fromEntries(Object.entries(state).map(([k, v]) => [k, () => v])),
    });

    // Test ng-touched
    expect(classes!['ng-touched'](mockField({ touched: true }))).toBe(true);
    expect(classes!['ng-touched'](mockField({ touched: false }))).toBe(false);

    // Test ng-untouched
    expect(classes!['ng-untouched'](mockField({ touched: false }))).toBe(true);
    expect(classes!['ng-untouched'](mockField({ touched: true }))).toBe(false);

    // Test ng-valid
    expect(classes!['ng-valid'](mockField({ valid: true }))).toBe(true);
    expect(classes!['ng-valid'](mockField({ valid: false }))).toBe(false);

    // Test ng-invalid
    expect(classes!['ng-invalid'](mockField({ invalid: true }))).toBe(true);
    expect(classes!['ng-invalid'](mockField({ invalid: false }))).toBe(false);

    // Test ng-dirty
    expect(classes!['ng-dirty'](mockField({ dirty: true }))).toBe(true);
    expect(classes!['ng-dirty'](mockField({ dirty: false }))).toBe(false);

    // Test ng-pristine
    expect(classes!['ng-pristine'](mockField({ dirty: false }))).toBe(true);
    expect(classes!['ng-pristine'](mockField({ dirty: true }))).toBe(false);

    // Test ng-pending
    expect(classes!['ng-pending'](mockField({ pending: true }))).toBe(true);
    expect(classes!['ng-pending'](mockField({ pending: false }))).toBe(false);
  });
});
