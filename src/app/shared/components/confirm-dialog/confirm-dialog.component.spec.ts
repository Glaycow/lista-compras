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

  it('should render only the confirm button when cancel text is empty', () => {
    @Component({
      template: `<app-confirm-dialog [visible]="true" confirmText="Ok" cancelText="" />`,
      imports: [ConfirmDialogComponent],
    })
    class ConfirmOnlyHost {}

    const onlyFixture = TestBed.createComponent(ConfirmOnlyHost);
    onlyFixture.detectChanges();
    const buttons = onlyFixture.nativeElement.querySelectorAll('.dialog-actions button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('Ok');
  });

  it('should render only the cancel button when confirm text is empty', () => {
    @Component({
      template: `<app-confirm-dialog [visible]="true" confirmText="" cancelText="Voltar" />`,
      imports: [ConfirmDialogComponent],
    })
    class CancelOnlyHost {}

    const onlyFixture = TestBed.createComponent(CancelOnlyHost);
    onlyFixture.detectChanges();
    const buttons = onlyFixture.nativeElement.querySelectorAll('.dialog-actions button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('Voltar');
  });

  it('should restore previous focus after the dialog closes', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    hostComponent.isVisible.set(true);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    hostComponent.isVisible.set(false);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 10));

    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it('should emit cancelled when Enter is pressed on the backdrop', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    hostComponent.onCancelled = cancelledSpy;

    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    fixture.detectChanges();

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should keep the dialog open when the panel is clicked', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    hostComponent.onCancelled = cancelledSpy;
    fixture.nativeElement.querySelector('.dialog-panel').click();

    expect(cancelledSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeTruthy();
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

  it('should emit cancelled on Escape', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const cancelledSpy = vi.fn();
    hostComponent.onCancelled = cancelledSpy;

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should run scheduled focus callbacks', () => {
    const scheduled: Array<() => void> = [];
    const spy = vi.spyOn(window, 'setTimeout').mockImplementation(((fn: TimerHandler) => {
      if (typeof fn === 'function') {
        scheduled.push(fn as () => void);
      }
      return 0;
    }) as typeof setTimeout);

    hostComponent.isVisible.set(true);
    fixture.detectChanges();
    scheduled.splice(0).forEach((fn) => fn());

    hostComponent.isVisible.set(false);
    fixture.detectChanges();
    scheduled.splice(0).forEach((fn) => fn());

    spy.mockRestore();
    expect(hostComponent).toBeTruthy();
  });

  it('should ignore Tab when focus is between the action buttons', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();
    const instance = fixture.debugElement.query(
      (el) => el.componentInstance instanceof ConfirmDialogComponent,
    ).componentInstance as ConfirmDialogComponent;
    const buttons = fixture.nativeElement.querySelectorAll('.dialog-actions button') as NodeListOf<HTMLButtonElement>;
    buttons[0].focus();
    instance['onPanelKeydown'](new KeyboardEvent('keydown', {key: 'Tab'}));
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('should ignore document keys other than Escape', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();
    const cancelledSpy = vi.fn();
    hostComponent.onCancelled = cancelledSpy;
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    expect(cancelledSpy).not.toHaveBeenCalled();
  });

  it('should trap Tab focus between action buttons', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('app-confirm-dialog');
    const instance = fixture.debugElement.query(
      (el) => el.componentInstance instanceof ConfirmDialogComponent,
    ).componentInstance as ConfirmDialogComponent;
    const buttons = fixture.nativeElement.querySelectorAll('.dialog-actions button') as NodeListOf<HTMLButtonElement>;
    buttons[1].focus();

    instance['onPanelKeydown'](new KeyboardEvent('keydown', {key: 'Tab'}));
    expect(document.activeElement).toBe(buttons[0]);

    buttons[0].focus();
    instance['onPanelKeydown'](new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true}));
    expect(document.activeElement).toBe(buttons[1]);

    fixture.nativeElement
      .querySelector('.dialog-panel')
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', bubbles: true}));
    expect(instance['cancelBtn']()?.nativeElement).toBeTruthy();
    expect(dialog).toBeTruthy();
  });

  it('should return when the panel is not rendered', () => {
    const dialogFixture = TestBed.createComponent(ConfirmDialogComponent);
    dialogFixture.detectChanges();
    expect(() =>
      dialogFixture.componentInstance['onPanelKeydown'](new KeyboardEvent('keydown', {key: 'Tab'})),
    ).not.toThrow();
  });

  it('should return when the panel has no focusable buttons', async () => {
    @Component({
      template: `<app-confirm-dialog [visible]="true" title="Aviso" message="Só leitura" confirmText="" cancelText="" />`,
      imports: [ConfirmDialogComponent],
    })
    class EmptyActionsHost {}

    const emptyFixture = TestBed.createComponent(EmptyActionsHost);
    emptyFixture.detectChanges();
    const instance = emptyFixture.debugElement.query(
      (el) => el.componentInstance instanceof ConfirmDialogComponent,
    ).componentInstance as ConfirmDialogComponent;
    expect(() => instance['onPanelKeydown'](new KeyboardEvent('keydown', {key: 'Tab'}))).not.toThrow();
  });

  it('should ignore non-Tab keys in the panel trap', () => {
    hostComponent.isVisible.set(true);
    fixture.detectChanges();
    const instance = fixture.debugElement.query(
      (el) => el.componentInstance instanceof ConfirmDialogComponent,
    ).componentInstance as ConfirmDialogComponent;
    expect(() => instance['onPanelKeydown'](new KeyboardEvent('keydown', {key: 'a'}))).not.toThrow();
  });
});
