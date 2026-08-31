import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter, withViewTransitions} from '@angular/router';
import {provideSignalFormsConfig} from '@angular/forms/signals';
import {provideSpartanHlm} from '@spartan-ng/helm/utils';
import {routes} from './app.routes';

export function skipReducedMotionTransition(event: {
  transition: {skipTransition: () => void};
}): void {
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    event.transition.skipTransition();
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideSpartanHlm(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions({
      onViewTransitionCreated: skipReducedMotionTransition,
    })),
    provideSignalFormsConfig({
      classes: {
        'ng-touched': (f) => f.state().touched(),
        'ng-untouched': (f) => !f.state().touched(),
        'ng-valid': (f) => f.state().valid(),
        'ng-invalid': (f) => f.state().invalid(),
        'ng-dirty': (f) => f.state().dirty(),
        'ng-pristine': (f) => !f.state().dirty(),
        'ng-pending': (f) => f.state().pending(),
      },
    }),
  ],
};
