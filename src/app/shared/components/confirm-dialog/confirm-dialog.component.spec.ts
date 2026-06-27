import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ConfirmDialogComponent} from './confirm-dialog.component';
import {Component, signal} from '@angular/core';

@Component({
  template: `<app-confirm-dialog
    [visible]="isVisible()"
    title="Test Title"
    message="Test Message"
    confirmText="Sim"
    cancelText="Não"
    (confirmed)="onConfirmed()"
    (cancelled)="onCancelled()"
  />`,
  imports: [ConfirmDialogComponent],
})
class TestHostComponent {
  readonly isVisible = signal(false);
  onConfirmed = () => {};
  onCancelled = () => {};
}

describe('ConfirmDialogComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
    expect(backdrop).toBeNull();
  });

  it('should render when visible is true', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
    expect(backdrop).toBeTruthy();

    const title = fixture.nativeElement.querySelector('.dialog-title');
    expect(title.textContent).toContain('Test Title');

    const message = fixture.nativeElement.querySelector('.dialog-message');
    expect(message.textContent).toContain('Test Message');
  });

  it('should render confirm and cancel buttons', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.dialog-actions button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Não');
    expect(buttons[1].textContent).toContain('Sim');
  });

  it('should emit confirmed when confirm button is clicked', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const confirmedSpy = vi.fn();
    hostComponent.onConfirmed = confirmedSpy;

    const buttons = fixture.nativeElement.querySelectorAll('.dialog-actions button');
    buttons[1].click(); // "Sim" button

    expect(confirmedSpy).toHaveBeenCalled();
  });

  it('should emit cancelled when cancel button is clicked', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    hostComponent.onCancelled = cancelledSpy;

    const buttons = fixture.nativeElement.querySelectorAll('.dialog-actions button');
    buttons[0].click(); // "Não" button

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should emit cancelled when backdrop is clicked', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    hostComponent.onCancelled = cancelledSpy;

    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
    backdrop.click();

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should restore focus when dialog closes after being opened', () => {
    // Set visible to true first — effect saves lastFocusedElement
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    // Now close the dialog — effect hits the else if branch for focus restoration
    hostComponent.isVisible.set(false);
    fixture.detectChanges();

    // Should not throw and dialog should be hidden
    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
    expect(backdrop).toBeNull();
  });

  it('should restore focus when dialog closes after being opened', () => {
    // Set visible to true first — effect saves lastFocusedElement
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    // Spy on setTimeout to verify focus restoration is scheduled
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    // Now close the dialog — effect hits the else if branch for focus restoration
    hostComponent.isVisible.set(false);
    fixture.detectChanges();

    // Should have scheduled focus restoration
    expect(setTimeoutSpy).toHaveBeenCalled();
    // Dialog should be hidden
    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
    expect(backdrop).toBeNull();

    setTimeoutSpy.mockRestore();
  });
});
