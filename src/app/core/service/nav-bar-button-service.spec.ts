import { TestBed } from '@angular/core/testing';

import { NavBarButtonService } from './nav-bar-button-service';

describe('NavBarButtonService', () => {
  let service: NavBarButtonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavBarButtonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
