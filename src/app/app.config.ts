import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, 
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ), 
    provideClientHydration(withEventReplay()),
    importProvidersFrom(BrowserAnimationsModule, HttpClientModule),
    provideHttpClient(),
    provideNativeDateAdapter(),
  ]
};
