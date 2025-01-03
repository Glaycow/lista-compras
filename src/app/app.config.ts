import {registerLocaleData} from '@angular/common';
import ptBr from '@angular/common/locales/pt';
import {ApplicationConfig, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter} from '@angular/router';
import Aura from '@primeng/themes/material';
import {provideIndexedDb} from 'ngx-indexed-db';
import {providePrimeNG} from 'primeng/config';

import {routes} from './app.routes';
import {dbConfig} from './shared/db/db-config';

registerLocaleData(ptBr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideIndexedDb(dbConfig),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
};
