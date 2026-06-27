import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter, withViewTransitions} from '@angular/router';
import {provideSignalFormsConfig} from '@angular/forms/signals';
import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions({
      onViewTransitionCreated: ({transition}) => {
        // Skip transition if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          transition.skipTransition();
        }
      },
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
