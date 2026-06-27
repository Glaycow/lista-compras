import {Component, effect, input, output, signal} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (visible()) {
      <div
        class="dialog-backdrop"
        (click)="onBackdropClick()"
        (keydown.escape)="cancel()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel()"
      >
        <div
          class="dialog-panel"
          (click)="$event.stopPropagation()"
          role="document"
          tabindex="-1"
        >
          <div class="dialog-icon">&#9888;</div>
          <h2 class="dialog-title">{{ title() }}</h2>
          <p class="dialog-message">{{ message() }}</p>

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
      font-size: 40px;
      margin-bottom: 12px;
      color: var(--error, #dc2626);
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

  private lastFocusedElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.visible()) {
        // Save current focus
        this.lastFocusedElement = document.activeElement as HTMLElement;
      } else if (this.lastFocusedElement) {
        // Restore focus after dialog closes
        setTimeout(() => this.lastFocusedElement?.focus());
        this.lastFocusedElement = null;
      }
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
}
