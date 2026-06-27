import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {AppBarComponent} from './app-bar-component';
import {NavBarButtonService} from '../service/nav-bar-button-service';

describe('AppBarComponent', () => {
  let component: AppBarComponent;
  let fixture: ComponentFixture<AppBarComponent>;
  let navService: NavBarButtonService;

  beforeEach(async () => {
    // Clear any persisted theme preference between tests
    localStorage.removeItem('theme-preference');
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [AppBarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppBarComponent);
    component = fixture.componentInstance;
    navService = TestBed.inject(NavBarButtonService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect the NavBarButtonService title signal', () => {
    expect(component.title()).toBe('');
    navService.setTitle('Compras');
    fixture.detectChanges();
    expect(component.title()).toBe('Compras');
  });

  it('should reflect the NavBarButtonService buttons signal', () => {
    expect(component.buttons()).toEqual([]);

    navService.addButton({
      id: 'test-btn',
      text: 'Testar',
      icon: 'plus',
      action: vi.fn(),
      visible: true,
    });

    expect(component.buttons()).toHaveLength(1);
    expect(component.buttons()[0].text).toBe('Testar');
  });

  it('should call the button action on onButtonClick', () => {
    const action = vi.fn();
    navService.addButton({
      id: 'action-btn',
      text: 'Ação',
      icon: 'play',
      action,
      visible: true,
    });

    const button = component.buttons()[0];
    component.onButtonClick(button);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should reflect urlBack from NavBarButtonService', () => {
    expect(component.urlBack()).toBeNull();
    navService.setarUrlBack('/shopping');
    expect(component.urlBack()).toBe('/shopping');
  });

  it('should render title in the DOM', () => {
    navService.setTitle('Minhas Compras');
    fixture.detectChanges();
    const titleEl: HTMLElement = fixture.nativeElement.querySelector('.title');
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent?.trim()).toBe('Minhas Compras');
  });

  // ────────────────────────────
  //  Theme toggle
  // ────────────────────────────

  it('should render theme toggle button in the DOM', () => {
    const themeBtn: HTMLElement = fixture.nativeElement.querySelector('.theme-toggle');
    expect(themeBtn).toBeTruthy();
    expect(themeBtn.getAttribute('aria-label')).toBe('Ativar modo escuro');
  });

  it('should toggle to dark mode and set data-theme', () => {
    const attrBefore = document.documentElement.getAttribute('data-theme');
    expect(attrBefore).toBeNull();

    component['toggleTheme']();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
    expect(component['isDarkMode']()).toBe(true);
  });

  it('should toggle back to light mode and set data-theme=light', () => {
    // First toggle to dark
    component['toggleTheme']();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Toggle back to light
    component['toggleTheme']();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme-preference')).toBe('light');
    expect(component['isDarkMode']()).toBe(false);
  });

  it('should clean up media query listener on destroy', () => {
    const removeSpy = vi.spyOn(
      component['mediaQuery']!,
      'removeEventListener',
    );

    component.ngOnDestroy();

    expect(removeSpy).toHaveBeenCalled();
  });

  // ────────────────────────────
  //  System preference change listener
  // ────────────────────────────

  it('should set data-theme=dark when system changes to dark with no saved preference', () => {
    // Clear any saved preference
    localStorage.removeItem('theme-preference');
    document.documentElement.removeAttribute('data-theme');

    // Get the internal handler and call it directly
    const handler = component['mediaQueryHandler'] as ((e: MediaQueryListEvent) => void) | null;
    expect(handler).toBeTruthy();

    handler!({ matches: true } as MediaQueryListEvent);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(component['isDarkMode']()).toBe(true);
  });

  it('should remove data-theme when system changes to light with no saved preference', () => {
    // Set up dark first
    document.documentElement.setAttribute('data-theme', 'dark');
    component['isDarkMode'].set(true);

    // Get the internal handler and call it directly
    const handler = component['mediaQueryHandler'] as ((e: MediaQueryListEvent) => void) | null;
    expect(handler).toBeTruthy();

    handler!({ matches: false } as MediaQueryListEvent);

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(component['isDarkMode']()).toBe(false);
  });

  it('should NOT respond to system preference when user has saved preference', () => {
    // Simulate saved preference
    localStorage.setItem('theme-preference', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    component['isDarkMode'].set(true);

    const handler = component['mediaQueryHandler'] as ((e: MediaQueryListEvent) => void) | null;
    expect(handler).toBeTruthy();

    // System tries to change to light, but saved preference overrides
    handler!({ matches: false } as MediaQueryListEvent);

    // Should NOT have changed
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(component['isDarkMode']()).toBe(true);
  });

  // ────────────────────────────
  //  Constructor with system preference
  // ────────────────────────────

  it('should set data-theme=dark on init when system prefers dark', async () => {
    // Save original matchMedia mock
    const originalMatchMedia = window.matchMedia;

    // Override to simulate dark mode preference
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    // Clean state
    localStorage.removeItem('theme-preference');
    document.documentElement.removeAttribute('data-theme');

    // Create a fresh component
    const darkFixture = TestBed.createComponent(AppBarComponent);
    const darkComponent = darkFixture.componentInstance;
    darkFixture.detectChanges();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(darkComponent['isDarkMode']()).toBe(true);

    // Restore original mock
    window.matchMedia = originalMatchMedia;
  });
});
