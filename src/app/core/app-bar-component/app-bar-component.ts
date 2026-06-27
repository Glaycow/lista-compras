import {Component, inject, OnDestroy, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NavbarButton} from '../model/nav-bar-button';
import {NavBarButtonService} from '../service/nav-bar-button-service';

@Component({
  selector: 'app-app-bar-component',
  imports: [
    RouterLink
  ],
  templateUrl: './app-bar-component.html',
  styleUrl: './app-bar-component.scss'
})
export class AppBarComponent implements OnDestroy {
  private readonly nabBarButtonService = inject(NavBarButtonService);
  readonly buttons = this.nabBarButtonService.buttons
  readonly title = this.nabBarButtonService.titleApp;
  readonly urlBack = this.nabBarButtonService.urlBack;

  protected readonly isDarkMode = signal(false);

  private readonly mediaQuery: MediaQueryList | null = null;
  private readonly mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    // Check system preference and saved preference on init
    const saved = localStorage.getItem('theme-preference');

    if (saved === 'dark') {
      this.isDarkMode.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (saved === 'light') {
      this.isDarkMode.set(false);
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkMode.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Listen for system preference changes when user hasn't set a manual preference
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery = mql;
    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme-preference')) {
        this.isDarkMode.set(e.matches);
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    };
    mql.addEventListener('change', this.mediaQueryHandler);
  }

  ngOnDestroy(): void {
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
    }
  }

  protected toggleTheme(): void {
    const newDark = !this.isDarkMode();
    this.isDarkMode.set(newDark);

    if (newDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme-preference', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme-preference', 'light');
    }
  }

  onButtonClick(button: NavbarButton) {
    button.action();
  }
}
