import 'fake-indexeddb/auto';
import '@angular/compiler';
import {getTestBed} from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

// JSDOM does not implement matchMedia — mock it for all tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);
