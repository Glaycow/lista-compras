import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import ItensComprasForm from './itens-compras-form';

describe('ItensComprasForm', () => {
  let component: ItensComprasForm;
  let fixture: ComponentFixture<ItensComprasForm>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: () => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItensComprasForm],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItensComprasForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
