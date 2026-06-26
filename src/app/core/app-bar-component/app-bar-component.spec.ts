import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TUI_OPTIONS } from '@taiga-ui/core';

import { AppBarComponent } from './app-bar-component';

describe('AppBarComponent', () => {
  let component: AppBarComponent;
  let fixture: ComponentFixture<AppBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppBarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: TUI_OPTIONS,
          useValue: { apis: 'stable', fontScaling: true, scrollbars: 'native' },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
