import {Injectable, signal} from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface ToastData {
  message: string;
  type: ToastType;
  action?: ToastAction;
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

  showWithAction(
    message: string,
    action: ToastAction,
    type: ToastType = 'info',
    duration = 5000,
  ): void {
    this.#cancelPending();
    this.#isExiting.set(false);
    this.#data.set({message, type, action});
    this.#autoDismissId = setTimeout(() => this.clear(), duration);
  }

  executeAction(): void {
    const action = this.#data()?.action;
    if (action) {
      action.callback();
    }
    this.clear();
  }

  clear(): void {
    this.#cancelAutoDismiss();

    if (this.#exitTimeoutId !== null) {
      clearTimeout(this.#exitTimeoutId);
      this.#exitTimeoutId = null;
    }

    if (this.#data() === null) {
      this.#isExiting.set(false);
      return;
    }

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
