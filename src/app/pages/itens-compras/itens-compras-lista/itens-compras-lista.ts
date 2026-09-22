import {CurrencyPipe} from '@angular/common';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HlmButton} from '@spartan-ng/helm/button';
import {HlmInput} from '@spartan-ng/helm/input';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {IconComponent} from '../../../shared/components/icon/icon';
import {ITEM_CATEGORIES} from '../../../shared/model/item-categories';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ToastService} from '../../../shared/service/toast.service';
import {parseRouteId} from '../../../shared/util/route-id';

type ItemFilter = 'all' | 'pending' | 'marked';

@Component({
  selector: 'app-itens-compras-lista',
  imports: [
    CurrencyPipe,
    RouterLink,
    ConfirmDialogComponent,
    IconComponent,
    DragDropModule,
    HlmButton,
    HlmInput,
  ],
  templateUrl: './itens-compras-lista.html',
  styleUrl: './itens-compras-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ItensComprasLista implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly route = inject(ActivatedRoute);
  private readonly shoppingItensService = inject(ShoppingItensService);
  private readonly toastService = inject(ToastService);

  protected readonly categories = ITEM_CATEGORIES;
  protected readonly shoppingId = signal<number | null>(null);
  protected readonly shopping = signal<Shopping | null>(null);
  protected readonly items = signal<ShoppingItem[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly itemFilter = signal<ItemFilter>('all');
  protected readonly isLoading = signal(false);

  protected readonly filteredItems = computed(() => {
    let result = this.items();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.itemFilter();

    if (filter === 'pending') {
      result = result.filter((i) => !i.itemMarcado);
    } else if (filter === 'marked') {
      result = result.filter((i) => i.itemMarcado);
    }

    if (query) {
      result = result.filter(
        (i) =>
          i.nome.toLowerCase().includes(query) ||
          (i.marca ?? '').toLowerCase().includes(query) ||
          (i.categoria ?? '').toLowerCase().includes(query),
      );
    }

    return result;
  });

  protected readonly groupedItems = computed(() => {
    const groups = new Map<string, ShoppingItem[]>();
    for (const item of this.filteredItems()) {
      const cat = item.categoria ?? 'Outros';
      const list = groups.get(cat) ?? [];
      list.push(item);
      groups.set(cat, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  protected readonly itensMarcados = computed(() => this.items().filter((item) => item.itemMarcado).length);
  protected readonly progressoPct = computed(() => {
    const total = this.items().length;
    return total ? (this.itensMarcados() / total) * 100 : 0;
  });
  protected readonly valorTotal = linkedSignal(() =>
    this.items().reduce((acc, item) => acc + item.valor * item.quantidade, 0),
  );
  protected readonly valorPego = linkedSignal(() =>
    this.items().reduce(
      (acc, item) => acc + item.valor * item.quantidade * Number(item.itemMarcado),
      0,
    ),
  );
  protected readonly orcamentoExcedido = computed(() => {
    const orcamento = this.shopping()?.orcamento;
    if (!orcamento) return false;
    return this.valorTotal() > orcamento;
  });

  protected readonly confirmDialogVisible = signal(false);
  protected readonly pendingDeleteItemId = signal<number | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = this.shoppingId();
      if (!id) return;
      const sub = this.shoppingItensService.watchItems(id).subscribe((items) => this.items.set(items));
      onCleanup(() => sub.unsubscribe());
    });
  }

  async ngOnInit(): Promise<void> {
    await this.getParamsRota();
    this.setarUrlBack();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  protected setFilter(filter: ItemFilter): void {
    this.itemFilter.set(filter);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected async toggleItemMarcado(item: ShoppingItem): Promise<void> {
    try {
      await this.shoppingItensService.updateItemMarcado(item);
    } catch {
      this.toastService.show('Não foi possível atualizar o item.', 'error');
    }
  }

  protected showDeleteConfirm(itemId: number, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteItemId.set(itemId);
    this.confirmDialogVisible.set(true);
  }

  protected async onDeleteConfirmed(): Promise<void> {
    const id = this.pendingDeleteItemId();
    if (id !== null) {
      try {
        const deleted = await this.shoppingItensService.remove(id);
        if (deleted) {
          this.toastService.showWithAction('Item excluído.', {
            label: 'Desfazer',
            callback: () => void this.shoppingItensService.restore(deleted),
          });
        }
      } catch {
        this.toastService.show('Não foi possível excluir o item.', 'error');
      }
    }
    this.confirmDialogVisible.set(false);
    this.pendingDeleteItemId.set(null);
  }

  protected onDeleteCancelled(): void {
    this.confirmDialogVisible.set(false);
    this.pendingDeleteItemId.set(null);
  }

  protected async onDrop(event: CdkDragDrop<ShoppingItem[]>, category: string): Promise<void> {
    const groupItems = [...event.container.data];
    moveItemInArray(groupItems, event.previousIndex, event.currentIndex);
    const otherItems = this.items().filter((i) => (i.categoria ?? 'Outros') !== category);
    const fullOrder = [...groupItems.map((i) => i.id!), ...otherItems.map((i) => i.id!)];
    try {
      await this.shoppingItensService.reorderItems(this.shoppingId()!, fullOrder);
    } catch {
      this.toastService.show('Não foi possível reordenar os itens.', 'error');
    }
  }

  protected enterShopMode(): void {
    void this.router.navigate(['/shopping', this.shoppingId(), 'shop']);
  }

  private async getParamsRota(): Promise<void> {
    const id = parseRouteId(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      void this.router.navigate(['/shopping']);
      return;
    }
    this.shoppingId.set(id);
    await this.loadData();
    if (!this.shopping()) {
      void this.router.navigate(['/shopping']);
      return;
    }
    this.setarButtonCreate();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const shopping = await this.shoppingItensService.getShoppingById(this.shoppingId()!);
      if (shopping) {
        this.shopping.set(shopping);
        this.setTitle(shopping.nome);
      }
    } catch {
      this.toastService.show('Não foi possível carregar os itens.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  private setarUrlBack(): void {
    this.navBarButtonService.setarUrlBack('/shopping');
  }

  private setTitle(title: string): void {
    this.navBarButtonService.setTitle(`Lista de compras ${title ?? ''}`);
  }

  private readonly cadastrarItemCompra = (): void =>
    void this.router.navigate([`/shopping/${this.shoppingId()}/items/new`]);

  private setarButtonCreate(): void {
    this.navBarButtonService.addButton({
      text: 'Adicionar item',
      id: 'add-compra',
      action: this.cadastrarItemCompra.bind(this),
      icon: 'plus',
      visible: true,
    });
  }
}
