import {ChangeDetectionStrategy, Component, input} from '@angular/core';

export type AppIconName = 'back' | 'plus' | 'minus' | 'edit' | 'trash' | 'sun' | 'moon' | 'warning';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (name()) {
      @case ('back') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6 9 12l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      }
      @case ('plus') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      }
      @case ('minus') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      }
      @case ('edit') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.12L16.62 5.5a1.5 1.5 0 0 0-2.12 0L4 16v4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      }
      @case ('trash') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 7h14M10 11v6M14 11v6M8 7l1-2h6l1 2M7 7v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      }
      @case ('sun') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
          <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      }
      @case ('moon') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 15.5A7 7 0 1 1 10.5 4a6 6 0 0 0 7.5 11.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      }
      @case ('warning') {
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9v5M12 17h.01M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<AppIconName>();
}
