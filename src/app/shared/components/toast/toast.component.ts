import {Component, inject, signal} from '@angular/core';
import {ToastService} from '../../service/toast.service';

const SWIPE_THRESHOLD = -50;

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  protected readonly swipeOffset = signal(0);
  protected readonly isSwiping = signal(false);

  private startY = 0;
  private swipeDismissed = false;

  protected onTouchStart(event: TouchEvent): void {
    this.startY = event.touches[0].clientY;
    this.swipeDismissed = false;
    this.isSwiping.set(true);
  }

  protected onTouchMove(event: TouchEvent): void {
    const deltaY = event.touches[0].clientY - this.startY;
    // Only allow swiping upward (negative delta); clamp to 0 for downward
    const offset = Math.min(deltaY, 0);
    this.swipeOffset.set(offset);
  }

  protected onTouchEnd(): void {
    if (this.swipeOffset() < SWIPE_THRESHOLD) {
      this.swipeDismissed = true;
      this.toastService.clear();
    }
    // Remove .swiping first to enable transition, then in the next
    // animation frame reset the position so the snap-back animates smoothly.
    this.isSwiping.set(false);
    requestAnimationFrame(() => {
      this.swipeOffset.set(0);
    });
  }

  protected onSwipeClick(): void {
    if (this.swipeDismissed) {
      this.swipeDismissed = false;
      return;
    }
    this.toastService.clear();
  }
}
