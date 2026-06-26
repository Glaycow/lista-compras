import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TuiAlertService } from '@taiga-ui/core';

import ItensComprasLista from './itens-compras-lista';

describe('ItensComprasLista', () => {
  let component: ItensComprasLista;
  let fixture: ComponentFixture<ItensComprasLista>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: () => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItensComprasLista],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        {
          provide: TuiAlertService,
          useValue: { open: () => ({ subscribe: () => {} }) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItensComprasLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
