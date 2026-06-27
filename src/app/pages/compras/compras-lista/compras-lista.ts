import {CurrencyPipe, DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingService} from '../../../shared/service/shopping-service';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-compras-lista',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    ConfirmDialogComponent,
  ],
  templateUrl: './compras-lista.html',
  styleUrl: './compras-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComprasLista implements OnInit, OnDestroy {
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly shoppingService = inject(ShoppingService);
  private readonly router = inject(Router);

  protected readonly shoppings = toSignal<Shopping[] | undefined>(this.shoppingService.shopping);
  protected readonly existeShopping = computed(() => this.shoppings()?.length === 0);

  /** All items keyed by shopping id, loaded reactively when shoppings change. */
  private readonly itemsByShopping = signal<Map<number, ShoppingItem[]>>(new Map());

  // Confirm dialog state
  protected readonly confirmDialogVisible = signal(false);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly confirmTitle = signal('');
  protected readonly confirmMessage = signal('');

  constructor() {
    effect(() => {
      const shops = this.shoppings();
      if (!shops || shops.length === 0) {
        this.itemsByShopping.set(new Map());
        return;
      }

      const ids = shops.map(s => s.id!).filter(Boolean);
      if (ids.length === 0) return;

      Promise.all(
        ids.map(id => this.shoppingService.getShoppingItensByShoppingId(id)),
      ).then(results => {
        this.itemsByShopping.set(new Map(ids.map((id, i) => [id, results[i]])));
      });
    });
  }

  ngOnInit(): void {
    this.setarButtonCreate();
    this.setTitle();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  /** Total geral de todas as listas (soma dos itens marcados). */
  protected readonly totalGeral = computed(() => {
    let total = 0;
    for (const items of this.itemsByShopping().values()) {
      for (const item of items) {
        if (item.itemMarcado) {
          total += item.valor * item.quantidade;
        }
      }
    }
    return total;
  });

  protected getItemCount(shoppingId: number): number {
    return this.itemsByShopping().get(shoppingId)?.length ?? 0;
  }

  protected getTotalMarcados(shoppingId: number): number {
    const items = this.itemsByShopping().get(shoppingId) ?? [];
    return items.reduce(
      (acc, item) => acc + item.valor * item.quantidade * Number(item.itemMarcado),
      0,
    );
  }

  protected showDeleteConfirm(id: number, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
    this.confirmTitle.set('Excluir lista');
    this.confirmMessage.set('Deseja realmente excluir esta lista de compras? Esta ação não pode ser desfeita.');
    this.confirmDialogVisible.set(true);
  }

  protected async onDeleteConfirmed(): Promise<void> {
    const id = this.pendingDeleteId();
    if (id !== null) {
      await this.shoppingService.remove(id);
    }
    this.confirmDialogVisible.set(false);
    this.pendingDeleteId.set(null);
  }

  protected onDeleteCancelled(): void {
    this.confirmDialogVisible.set(false);
    this.pendingDeleteId.set(null);
  }

  private readonly createShopping = (): void => void this.router.navigate(['shopping/new']);

  private setarButtonCreate(): void {
    this.navBarButtonService.addButton({
      text: 'Adicionar Compras',
      id: 'add-compra',
      action: this.createShopping.bind(this),
      icon: '@tui.circle-plus',
      visible: true,
    });
  }

  private setTitle(): void {
    this.navBarButtonService.setTitle('Compras');
  }
}
