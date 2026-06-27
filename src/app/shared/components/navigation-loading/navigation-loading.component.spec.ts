import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart} from '@angular/router';
import {NavigationLoadingComponent} from './navigation-loading.component';

describe('NavigationLoadingComponent', () => {
  let component: NavigationLoadingComponent;
  let fixture: ComponentFixture<NavigationLoadingComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationLoadingComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationLoadingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with loading as false', () => {
    expect(component['loading']()).toBe(false);
  });

  it('should not show loading bar initially', () => {
    const bar = fixture.nativeElement.querySelector('.loading-bar');
    expect(bar).toBeTruthy();
    expect(bar.classList.contains('visible')).toBe(false);
  });

  it('should show loading bar on NavigationStart', () => {
    router.events.next(new NavigationStart(1, '/test'));
    fixture.detectChanges();

    expect(component['loading']()).toBe(true);
    const bar = fixture.nativeElement.querySelector('.loading-bar');
    expect(bar.classList.contains('visible')).toBe(true);
  });

  it('should hide loading bar on NavigationEnd after delay', () => {
    vi.useFakeTimers();
    router.events.next(new NavigationStart(1, '/test'));
    expect(component['loading']()).toBe(true);

    router.events.next(new NavigationEnd(1, '/test', '/test'));
    expect(component['loading']()).toBe(true); // Still true during the 150ms delay

    vi.advanceTimersByTime(150);
    fixture.detectChanges();

    expect(component['loading']()).toBe(false);
  });

  it('should hide loading bar on NavigationCancel after delay', () => {
    vi.useFakeTimers();
    router.events.next(new NavigationStart(1, '/test'));
    expect(component['loading']()).toBe(true);

    router.events.next(new NavigationCancel(1, '/test', 'User cancelled'));
    expect(component['loading']()).toBe(true); // Still true during the 150ms delay

    vi.advanceTimersByTime(150);
    fixture.detectChanges();

    expect(component['loading']()).toBe(false);
  });

  it('should hide loading bar on NavigationError after delay', () => {
    vi.useFakeTimers();
    router.events.next(new NavigationStart(1, '/test'));
    expect(component['loading']()).toBe(true);

    router.events.next(new NavigationError(1, '/test', new Error('Failed')));
    expect(component['loading']()).toBe(true); // Still true during the 150ms delay

    vi.advanceTimersByTime(150);
    fixture.detectChanges();

    expect(component['loading']()).toBe(false);
  });

  it('should clear timeout on consecutive navigations', () => {
    vi.useFakeTimers();
    router.events.next(new NavigationStart(1, '/first'));
    expect(component['loading']()).toBe(true);

    // End first navigation (starts 150ms timer)
    router.events.next(new NavigationEnd(1, '/first', '/first'));

    // Start second navigation immediately (should clear the first timer)
    router.events.next(new NavigationStart(2, '/second'));
    expect(component['loading']()).toBe(true);

    // Advance past the first timer's 150ms — should NOT have hidden
    vi.advanceTimersByTime(150);
    expect(component['loading']()).toBe(true);

    // End second navigation
    router.events.next(new NavigationEnd(2, '/second', '/second'));
    vi.advanceTimersByTime(150);
    fixture.detectChanges();

    expect(component['loading']()).toBe(false);
  });

  it('should unsubscribe and clear timeout on destroy', () => {
    vi.useFakeTimers();
    router.events.next(new NavigationStart(1, '/test'));
    router.events.next(new NavigationEnd(1, '/test', '/test'));

    const clearSpy = vi.spyOn(window, 'clearTimeout');
    component.ngOnDestroy();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('should set aria-hidden correctly', () => {
    const bar = fixture.nativeElement.querySelector('.loading-bar');
    expect(bar.getAttribute('aria-hidden')).toBe('true');

    router.events.next(new NavigationStart(1, '/test'));
    fixture.detectChanges();

    expect(bar.getAttribute('aria-hidden')).toBe('false');
  });
});
