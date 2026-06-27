import {Component, inject, OnDestroy, signal} from '@angular/core';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router} from '@angular/router';

@Component({
  selector: 'app-navigation-loading',
  template: `
    <div
      class="loading-bar"
      [class.visible]="loading()"
      role="progressbar"
      aria-label="Carregando página"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="100"
      [attr.aria-hidden]="!loading()"
    ></div>
  `,
})
export class NavigationLoadingComponent implements OnDestroy {
  private readonly router = inject(Router);
  protected readonly loading = signal(false);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly sub = this.router.events.subscribe((event) => {
    if (event instanceof NavigationStart) {
      this.clearTimeout();
      this.loading.set(true);
    } else if (
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    ) {
      // Keep visible briefly for a smooth exit animation
      this.timeoutId = setTimeout(() => {
        this.loading.set(false);
        this.timeoutId = null;
      }, 150);
    }
  });

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.clearTimeout();
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
