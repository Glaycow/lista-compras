import {CurrencyPipe, DecimalPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {HlmButton} from '@spartan-ng/helm/button';
import {NavBarButtonService} from '../../core/service/nav-bar-button-service';
import {MonthlySpending, PriceEvolution, TopPurchasedItem} from '../../shared/model/statistics';
import {StatisticsService} from '../../shared/service/statistics-service';

@Component({
  selector: 'app-estatisticas',
  imports: [CurrencyPipe, DecimalPipe, HlmButton, RouterLink],
  templateUrl: './estatisticas.html',
  styleUrl: './estatisticas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Estatisticas implements OnInit, OnDestroy {
  private readonly statisticsService = inject(StatisticsService);
  private readonly navBarButtonService = inject(NavBarButtonService);

  protected readonly isLoading = signal(true);
  protected readonly monthlySpending = signal<MonthlySpending[]>([]);
  protected readonly topItems = signal<TopPurchasedItem[]>([]);
  protected readonly priceEvolutions = signal<PriceEvolution[]>([]);

  protected readonly maxMonthlyTotal = computed(() => {
    const totals = this.monthlySpending().map((m) => m.total);
    return totals.length ? Math.max(...totals) : 0;
  });

  protected readonly hasData = computed(
    () =>
      this.monthlySpending().length > 0 ||
      this.topItems().length > 0 ||
      this.priceEvolutions().length > 0,
  );

  async ngOnInit(): Promise<void> {
    this.navBarButtonService.setTitle('Estatísticas');
    this.navBarButtonService.setarUrlBack('/shopping');
    await this.load();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  protected barWidth(total: number): number {
    const max = this.maxMonthlyTotal();
    if (!max || !total) return 0;
    return Math.max(4, (total / max) * 100);
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [monthly, top, prices] = await Promise.all([
        this.statisticsService.getMonthlySpending(),
        this.statisticsService.getTopPurchasedItems(),
        this.statisticsService.getPriceEvolutions(),
      ]);
      this.monthlySpending.set(monthly);
      this.topItems.set(top);
      this.priceEvolutions.set(prices);
    } finally {
      this.isLoading.set(false);
    }
  }
}
