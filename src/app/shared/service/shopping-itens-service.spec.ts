import { TestBed } from '@angular/core/testing';

import { ShoppingItensService } from './shopping-itens-service';

describe('ShoppingItensService', () => {
  let service: ShoppingItensService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoppingItensService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
