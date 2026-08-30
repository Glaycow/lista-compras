import 'fake-indexeddb/auto';
import '@angular/compiler';
import {getTestBed} from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
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

const testBed = getTestBed();
if (!testBed.platform) {
  testBed.initTestEnvironment(
    BrowserTestingModule,
    platformBrowserTesting(),
  );
}
