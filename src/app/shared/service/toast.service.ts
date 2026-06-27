import {Injectable, signal} from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

export const TOAST_EXIT_DURATION = 200;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly #data = signal<ToastData | null>(null);
  readonly data = this.#data.asReadonly();
  readonly #isExiting = signal(false);
  readonly isExiting = this.#isExiting.asReadonly();

  #autoDismissId: ReturnType<typeof setTimeout> | null = null;
  #exitTimeoutId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'success', duration = 3000): void {
    this.#cancelPending();
    this.#isExiting.set(false);
    this.#data.set({message, type});
    this.#autoDismissId = setTimeout(() => this.clear(), duration);
  }

  clear(): void {
    this.#cancelAutoDismiss();

    // Cancel any pending exit to avoid duplicate timeouts
    if (this.#exitTimeoutId !== null) {
      clearTimeout(this.#exitTimeoutId);
      this.#exitTimeoutId = null;
    }

    if (this.#data() === null) {
      this.#isExiting.set(false);
      return;
    }

    // Start exit animation
    this.#isExiting.set(true);
    this.#exitTimeoutId = setTimeout(() => {
      this.#data.set(null);
      this.#isExiting.set(false);
    }, TOAST_EXIT_DURATION);
  }

  #cancelPending(): void {
    this.#cancelAutoDismiss();
    if (this.#exitTimeoutId !== null) {
      clearTimeout(this.#exitTimeoutId);
      this.#exitTimeoutId = null;
    }
  }

  #cancelAutoDismiss(): void {
    if (this.#autoDismissId !== null) {
      clearTimeout(this.#autoDismissId);
      this.#autoDismissId = null;
    }
  }
}
