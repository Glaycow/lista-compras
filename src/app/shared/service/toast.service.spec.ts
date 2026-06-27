import {TestBed} from '@angular/core/testing';
import {ToastService, TOAST_EXIT_DURATION} from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null data and false isExiting', () => {
    expect(service.data()).toBeNull();
    expect(service.isExiting()).toBe(false);
  });

  // ────────────────────────────
  //  show()
  // ────────────────────────────

  it('should set data with the given message and default type (success)', () => {
    service.show('Operação concluída');
    expect(service.data()).toEqual({message: 'Operação concluída', type: 'success'});
    expect(service.isExiting()).toBe(false);
  });

  it('should accept custom type (error / info)', () => {
    service.show('Algo deu errado', 'error');
    expect(service.data()).toEqual({message: 'Algo deu errado', type: 'error'});

    service.show('Atenção', 'info');
    expect(service.data()).toEqual({message: 'Atenção', type: 'info'});
  });

  // ────────────────────────────
  //  clear()
  // ────────────────────────────

  it('should start exit animation on clear(), then remove data after 200ms', () => {
    service.show('Saindo...');

    service.clear();
    expect(service.isExiting()).toBe(true);
    // Data is still present during the exit animation
    expect(service.data()).not.toBeNull();

    vi.advanceTimersByTime(TOAST_EXIT_DURATION);
    expect(service.data()).toBeNull();
    expect(service.isExiting()).toBe(false);
  });

  it('should be a no-op when clear() is called with no toast', () => {
    expect(service.data()).toBeNull();

    service.clear();

    expect(service.data()).toBeNull();
    expect(service.isExiting()).toBe(false);
  });

  it('should handle multiple clear() calls without duplication', () => {
    service.show('Test');

    service.clear(); // first — starts exit
    service.clear(); // second — cancels pending exit timeout, restarts it

    expect(service.isExiting()).toBe(true);
    expect(service.data()).not.toBeNull();

    // Only one exit timeout should be running, so data should be null
    // after TOAST_EXIT_DURATION (not 2×)
    vi.advanceTimersByTime(TOAST_EXIT_DURATION);
    expect(service.data()).toBeNull();
    expect(service.isExiting()).toBe(false);
  });

  // ────────────────────────────
  //  Auto-dismiss
  // ────────────────────────────

  it('should auto-dismiss after the default duration (3000ms)', () => {
    service.show('Auto');

    vi.advanceTimersByTime(3000);
    // Auto-dismiss fires, starting the exit
    expect(service.isExiting()).toBe(true);
    expect(service.data()).not.toBeNull();

    vi.advanceTimersByTime(TOAST_EXIT_DURATION);
    expect(service.data()).toBeNull();
    expect(service.isExiting()).toBe(false);
  });

  it('should auto-dismiss after a custom duration', () => {
    service.show('Rápido', 'success', 500);

    vi.advanceTimersByTime(500);
    expect(service.isExiting()).toBe(true);

    vi.advanceTimersByTime(TOAST_EXIT_DURATION);
    expect(service.data()).toBeNull();
  });

  // ────────────────────────────
  //  Replace / cancel
  // ────────────────────────────

  it('should replace an existing toast when show() is called again', () => {
    service.show('Primeiro');
    service.show('Segundo');

    // The first auto-dismiss was cancelled — only the second should fire
    vi.advanceTimersByTime(3000);
    expect(service.data()?.message).toBe('Segundo');
    expect(service.isExiting()).toBe(true);
  });

  it('should cancel a running exit animation when show() is called mid-exit', () => {
    service.show('Inicial');
    service.clear(); // starts exit
    expect(service.isExiting()).toBe(true);

    // Call show() while the exit animation is still running
    service.show('Novo Toast', 'info');
    expect(service.isExiting()).toBe(false);
    expect(service.data()).toEqual({message: 'Novo Toast', type: 'info'});

    // The old exit timeout was cancelled, so the new toast stays visible
    vi.advanceTimersByTime(TOAST_EXIT_DURATION + 100);
    expect(service.data()).not.toBeNull();
  });

  // ────────────────────────────
  //  Edge cases
  // ────────────────────────────

  it('should still work correctly when show() is called rapidly', () => {
    service.show('A');
    service.show('B');
    service.show('C');

    expect(service.data()?.message).toBe('C');
    expect(service.isExiting()).toBe(false);

    vi.advanceTimersByTime(3000);
    expect(service.isExiting()).toBe(true);

    vi.advanceTimersByTime(TOAST_EXIT_DURATION);
    expect(service.data()).toBeNull();
  });
});
