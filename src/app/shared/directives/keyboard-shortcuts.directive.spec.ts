import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideZonelessChangeDetection} from '@angular/core';
import {KeyboardShortcutsDirective} from './keyboard-shortcuts.directive';

@Component({template: ''})
class BlankComponent {}

@Component({
  standalone: true,
  template: `<div appKeyboardShortcuts></div>`,
  imports: [KeyboardShortcutsDirective],
})
class HostComponent {}

describe('KeyboardShortcutsDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {path: 'shopping', component: BlankComponent},
          {path: 'shopping/new', component: BlankComponent},
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should ignore shortcuts when typing in input', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'n', bubbles: true}));
    expect(navigateSpy).not.toHaveBeenCalled();
    input.remove();
  });

  it('should navigate home on Escape', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(window, 'history', {value: {length: 2}, configurable: true});
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping']);
  });
});
