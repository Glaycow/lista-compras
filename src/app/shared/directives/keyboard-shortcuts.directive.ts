import {Directive, inject, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Directive({
  selector: '[appKeyboardShortcuts]',
  standalone: true,
})
export class KeyboardShortcutsDirective implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly handler = (event: KeyboardEvent): void => this.onKeydown(event);

  ngOnInit(): void {
    document.addEventListener('keydown', this.handler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handler);
  }

  private onKeydown(event: KeyboardEvent): void {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (event.key === 'Escape') {
      if (window.history.length > 1) {
        event.preventDefault();
        void this.router.navigate(['/shopping']);
      }
      return;
    }

    if (event.key === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const path = this.router.url;
      const itemsMatch = path.match(/^\/shopping\/(\d+)\/items$/);
      if (itemsMatch) {
        event.preventDefault();
        void this.router.navigate(['/shopping', itemsMatch[1], 'items', 'new']);
        return;
      }
      if (path === '/shopping') {
        event.preventDefault();
        void this.router.navigate(['/shopping/new']);
      }
    }
  }
}
