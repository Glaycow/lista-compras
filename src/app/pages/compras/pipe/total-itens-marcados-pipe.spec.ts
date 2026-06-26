import { TestBed } from '@angular/core/testing';

import { TotalItensMarcadosPipe } from './total-itens-marcados-pipe';

describe('TotalItensMarcadosPipe', () => {
  it('create an instance', () => {
    TestBed.runInInjectionContext(() => {
      const pipe = new TotalItensMarcadosPipe();
      expect(pipe).toBeTruthy();
    });
  });
});
