import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasForm } from './compras-form';

describe('ComprasForm', () => {
  let component: ComprasForm;
  let fixture: ComponentFixture<ComprasForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
