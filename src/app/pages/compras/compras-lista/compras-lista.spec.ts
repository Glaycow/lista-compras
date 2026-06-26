import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TuiAlertService } from '@taiga-ui/core';

import ComprasLista from './compras-lista';

describe('ComprasLista', () => {
  let component: ComprasLista;
  let fixture: ComponentFixture<ComprasLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasLista],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: TuiAlertService,
          useValue: { open: () => ({ subscribe: () => {} }) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
