import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItensComprasForm } from './itens-compras-form';

describe('ItensComprasForm', () => {
  let component: ItensComprasForm;
  let fixture: ComponentFixture<ItensComprasForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItensComprasForm]
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
