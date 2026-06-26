import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import ComprasForm from './compras-form';

describe('ComprasForm', () => {
  let component: ComprasForm;
  let fixture: ComponentFixture<ComprasForm>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: () => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasForm],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
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
