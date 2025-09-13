import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasLista } from './compras-lista';

describe('ComprasLista', () => {
  let component: ComprasLista;
  let fixture: ComponentFixture<ComprasLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasLista]
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
