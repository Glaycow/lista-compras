import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {AppIconName, IconComponent} from './icon';

const ICONS: AppIconName[] = [
  'back', 'plus', 'minus', 'edit', 'trash', 'sun', 'moon', 'warning', 'download', 'upload',
];

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
  });

  it.each(ICONS)('should render the %s icon', (name) => {
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });
});
