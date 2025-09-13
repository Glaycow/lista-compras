import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItensComprasLista } from './itens-compras-lista';

describe('ItensComprasLista', () => {
  let component: ItensComprasLista;
  let fixture: ComponentFixture<ItensComprasLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItensComprasLista]
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
