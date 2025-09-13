import { provideEventPlugins } from "@taiga-ui/event-plugins";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TUI_LANGUAGE, TUI_PORTUGUESE_LANGUAGE } from '@taiga-ui/i18n';
import { routes } from './app.routes';
import { of } from "rxjs";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideEventPlugins(),
    {
      provide: TUI_LANGUAGE,
      useValue: of(TUI_PORTUGUESE_LANGUAGE),
    },
  ]
};
