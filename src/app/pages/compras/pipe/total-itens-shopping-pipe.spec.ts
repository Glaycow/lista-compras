import { TestBed } from '@angular/core/testing';

import { TotalItensShoppingPipe } from './total-itens-shopping-pipe';

describe('TotalItensShoppingPipe', () => {
  it('create an instance', () => {
    TestBed.runInInjectionContext(() => {
      const pipe = new TotalItensShoppingPipe();
      expect(pipe).toBeTruthy();
    });
  });
});
