import {Component, effect, ElementRef, input, output, viewChild} from '@angular/core';
import {IconComponent} from '../icon/icon';

@Component({
  selector: 'app-confirm-dialog',
  imports: [IconComponent],
  template: `
    @if (visible()) {
      <div
        class="dialog-backdrop"
        tabindex="-1"
        (click)="onBackdropClick()"
        (keydown.enter)="onBackdropClick()"
      >
        <div
          #panel
          class="dialog-panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="messageId"
          tabindex="-1"
          (click)="$event.stopPropagation()"
          (keydown)="onPanelKeydown($event)"
        >
          <div class="dialog-icon"><app-icon name="warning" /></div>
          <h2 class="dialog-title" [id]="titleId">{{ title() }}</h2>
          <p class="dialog-message" [id]="messageId">{{ message() }}</p>

          @if (confirmText() || cancelText()) {
            <div class="dialog-actions">
              @if (cancelText()) {
                <button
                  class="btn btn-secondary"
                  (click)="cancel()"
                  #cancelBtn
                >
                  {{ cancelText() }}
                </button>
              }
              @if (confirmText()) {
                <button
                  class="btn btn-danger"
                  (click)="confirm()"
                  #confirmBtn
                >
                  {{ confirmText() }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-overlay, rgba(0,0,0,0.4));
      padding: 24px;
      animation: backdropIn 0.2s ease;
    }

    @keyframes backdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-panel {
      background: var(--bg-secondary, #ffffff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 16px;
      padding: 32px 28px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.12));
      animation: panelIn 0.25s ease;
      text-align: center;
      outline: none;
    }

    @keyframes panelIn {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(12px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .dialog-icon {
      margin-bottom: 12px;
      color: var(--error, #dc2626);

      app-icon {
        width: 40px;
        height: 40px;
      }
    }

    .dialog-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary, #111827);
      margin: 0 0 8px;
    }

    .dialog-message {
      font-size: 14px;
      color: var(--text-muted, #6b7280);
      line-height: 1.5;
      margin: 0 0 24px;
    }

    .dialog-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .btn {
      padding: 11px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      min-width: 100px;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn-secondary {
      background: var(--btn-secondary-bg, #f3f4f6);
      color: var(--btn-secondary-text, #374151);
      border: 1px solid var(--btn-secondary-border, #d1d5db);

      &:hover {
        background: var(--btn-secondary-hover-bg, #e5e7eb);
        border-color: var(--btn-secondary-hover-border, #9ca3af);
      }
    }

    .btn-danger {
      background: var(--error, #dc2626);
      color: #ffffff;

      &:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    @media (max-width: 480px) {
      .dialog-panel {
        padding: 24px 20px 20px;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
        padding: 14px;
        min-height: 48px;
      }
    }
  `],
})
export class ConfirmDialogComponent {
  readonly visible = input(false);
  readonly title = input('Confirmação');
  readonly message = input('Tem certeza que deseja realizar esta ação?');
  readonly confirmText = input('Confirmar');
  readonly cancelText = input('Cancelar');
  readonly ariaLabel = input('Diálogo de confirmação');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleId = 'confirm-dialog-title';
  protected readonly messageId = 'confirm-dialog-message';

  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private lastFocusedElement: HTMLElement | null = null;

  constructor() {
    effect((onCleanup) => {
      if (!this.visible()) {
        if (this.lastFocusedElement) {
          const restore = this.lastFocusedElement;
          this.lastFocusedElement = null;
          setTimeout(() => restore.focus());
        }
        return;
      }

      this.lastFocusedElement = document.activeElement as HTMLElement;
      const onDocumentKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.cancel();
        }
      };
      document.addEventListener('keydown', onDocumentKey);
      setTimeout(() => this.cancelBtn()?.nativeElement.focus());
      onCleanup(() => document.removeEventListener('keydown', onDocumentKey));
    });
  }

  protected confirm(): void {
    this.confirmed.emit();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected onBackdropClick(): void {
    this.cancel();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const panel = this.panel()?.nativeElement;
    if (!panel) {
      return;
    }

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
