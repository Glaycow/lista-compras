import {CurrencyPipe} from '@angular/common';
import {Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ToastService} from '../../../shared/service/toast.service';
import {parseRouteId} from '../../../shared/util/route-id';

@Component({
  selector: 'app-itens-compras-modo',
  imports: [CurrencyPipe],
  templateUrl: './itens-compras-modo.html',
  styleUrl: './itens-compras-modo.scss',
})
export default class ItensComprasModo implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly shoppingItensService = inject(ShoppingItensService);
  private readonly toastService = inject(ToastService);

  protected readonly shoppingId = signal<number | null>(null);
  protected readonly shopping = signal<Shopping | null>(null);
  protected readonly items = signal<ShoppingItem[]>([]);

  protected readonly pendentes = computed(() => this.items().filter((i) => !i.itemMarcado));
  protected readonly marcados = computed(() => this.items().filter((i) => i.itemMarcado));
  protected readonly progressoPct = computed(() => {
    const total = this.items().length;
    return total ? (this.marcados().length / total) * 100 : 0;
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.shoppingId();
      if (!id) return;
      const sub = this.shoppingItensService.watchItems(id).subscribe((items) => this.items.set(items));
      onCleanup(() => sub.unsubscribe());
    });
  }

  async ngOnInit(): Promise<void> {
    const id = parseRouteId(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      void this.router.navigate(['/shopping']);
      return;
    }
    this.shoppingId.set(id);
    const shopping = await this.shoppingItensService.getShoppingById(id);
    if (!shopping) {
      void this.router.navigate(['/shopping']);
      return;
    }
    this.shopping.set(shopping);
    this.navBarButtonService.setTitle(`Modo compra — ${shopping.nome}`);
    this.navBarButtonService.setarUrlBack(`/shopping/${id}/items`);
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  protected async toggleItem(item: ShoppingItem): Promise<void> {
    try {
      await this.shoppingItensService.updateItemMarcado(item);
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch {
      this.toastService.show('Não foi possível atualizar o item.', 'error');
    }
  }

  protected exitMode(): void {
    void this.router.navigate(['/shopping', this.shoppingId(), 'items']);
  }
}
