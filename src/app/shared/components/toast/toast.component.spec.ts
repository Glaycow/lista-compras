import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ToastComponent} from './toast.component';
import {ToastService} from '../../service/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with swipeOffset 0 and isSwiping false', () => {
    expect(component['swipeOffset']()).toBe(0);
    expect(component['isSwiping']()).toBe(false);
  });

  // ────────────────────────────
  //  Rendering via ToastService
  // ────────────────────────────

  it('should render nothing when no toast is shown', () => {
    const overlay = fixture.nativeElement.querySelector('.toast-overlay');
    expect(overlay).toBeNull();
  });

  it('should render toast when ToastService has data', () => {
    toastService.show('Teste de notificação');
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.toast-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.textContent).toContain('Teste de notificação');
  });

  it('should apply success class by default', () => {
    toastService.show('Sucesso!');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList).toContain('success');
  });

  it('should apply error class for error type', () => {
    toastService.show('Erro!', 'error');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList).toContain('error');
  });

  it('should apply info class for info type', () => {
    toastService.show('Info', 'info');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList).toContain('info');
  });

  it('should render the close button', () => {
    toastService.show('Fechável');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.toast-close');
    expect(btn).toBeTruthy();
  });

  // ────────────────────────────
  //  Click-to-dismiss via onSwipeClick
  // ────────────────────────────

  it('should call clear() on click via onSwipeClick', () => {
    const clearSpy = vi.spyOn(toastService, 'clear');
    component['onSwipeClick']();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('should skip clear() on onSwipeClick if swipeDismissed is true', () => {
    const clearSpy = vi.spyOn(toastService, 'clear');
    component['swipeDismissed'] = true;

    component['onSwipeClick']();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(component['swipeDismissed']).toBe(false);
  });

  // ────────────────────────────
  //  Touch / swipe handlers
  // ────────────────────────────

  it('should record startY and set isSwiping on touchstart', () => {
    const event = new TouchEvent('touchstart', {
      touches: [{clientY: 200} as Touch],
    });

    component['onTouchStart'](event);
    expect(component['startY']).toBe(200);
    expect(component['isSwiping']()).toBe(true);
    expect(component['swipeDismissed']).toBe(false);
  });

  it('should update swipeOffset on touchmove (upward only)', () => {
    component['startY'] = 200;

    const event = new TouchEvent('touchmove', {
      touches: [{clientY: 150} as Touch], // swiped up 50px
    });

    component['onTouchMove'](event);
    expect(component['swipeOffset']()).toBe(-50);
  });

  it('should clamp downward swipe to 0 on touchmove', () => {
    component['startY'] = 200;

    const event = new TouchEvent('touchmove', {
      touches: [{clientY: 250} as Touch], // swiped down 50px
    });

    component['onTouchMove'](event);
    expect(component['swipeOffset']()).toBe(0); // clamped
  });

  it('should dismiss toast on touchend when threshold met', () => {
    const clearSpy = vi.spyOn(toastService, 'clear');
    component['swipeOffset'].set(-60); // beyond threshold (-50)

    // Run requestAnimationFrame synchronously
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    raf.mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    component['onTouchEnd']();
    expect(clearSpy).toHaveBeenCalled();
    expect(component['swipeDismissed']).toBe(true);
    expect(component['isSwiping']()).toBe(false);
    expect(component['swipeOffset']()).toBe(0);

    raf.mockRestore();
  });

  it('should NOT dismiss toast on touchend when threshold NOT met', () => {
    const clearSpy = vi.spyOn(toastService, 'clear');
    component['swipeOffset'].set(-30); // within threshold

    const raf = vi.spyOn(window, 'requestAnimationFrame');
    raf.mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    component['onTouchEnd']();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(component['swipeDismissed']).toBe(false);

    raf.mockRestore();
  });

  // ────────────────────────────
  //  Keyboard (via template events)
  // ────────────────────────────

  it('should clear on Enter via onSwipeClick', () => {
    const clearSpy = vi.spyOn(toastService, 'clear');
    component['onSwipeClick']();
    expect(clearSpy).toHaveBeenCalled();
  });

  // ────────────────────────────
  //  Exiting CSS class
  // ────────────────────────────

  it('should add exiting class when ToastService.isExiting is true', () => {
    toastService.show('Saindo...');
    fixture.detectChanges();

    // Simulate the exiting state by calling clear (which sets isExiting)
    // but we need to advance timers in a controlled way
    const overlay = fixture.nativeElement.querySelector('.toast-overlay') as HTMLElement;
    expect(overlay.classList).not.toContain('exiting');

    // Calling clear will set isExiting = true
    toastService.clear();
    fixture.detectChanges();

    expect(overlay.classList).toContain('exiting');
  });
});
