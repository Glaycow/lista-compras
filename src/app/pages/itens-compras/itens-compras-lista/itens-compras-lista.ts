import {CurrencyPipe} from '@angular/common';
import {Component, computed, inject, linkedSignal, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ToastService} from '../../../shared/service/toast.service';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {IconComponent} from '../../../shared/components/icon/icon';
import {parseRouteId} from '../../../shared/util/route-id';

@Component({
  selector: 'app-itens-compras-lista',
  imports: [
    CurrencyPipe,
    RouterLink,
    ConfirmDialogComponent,
    IconComponent,
  ],
  templateUrl: './itens-compras-lista.html',
  styleUrl: './itens-compras-lista.scss'
})
export default class ItensComprasLista implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly route = inject(ActivatedRoute);
  protected readonly shoppingItensService = inject(ShoppingItensService);
  private readonly toastService = inject(ToastService);
  shoppingId = signal<number | null>(null);
  shopping = signal<Shopping | null>(null);
  items = this.shoppingItensService.shoppingItens;
  protected readonly itensMarcados = computed(() => this.items().filter((item) => item.itemMarcado).length);
  protected readonly progressoPct = computed(() => {
    const total = this.items().length;
    return total ? (this.itensMarcados() / total) * 100 : 0;
  });
  protected valorTotal = linkedSignal(() => this.items().reduce((acc, item) => acc + (item.valor * item.quantidade), 0));
  protected valorPego = linkedSignal(() => this.items().reduce((acc, item) => acc + ((item.valor * item.quantidade) * Number(item.itemMarcado)), 0));
  isLoading = signal(false);

  protected readonly confirmDialogVisible = signal(false);
  protected readonly pendingDeleteItemId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
   await this.getParamsRota();
   this.setarUrlBack();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  async toggleItemMarcado(item: ShoppingItem): Promise<void> {
    try {
      await this.shoppingItensService.updateItemMarcado(item);
      await this.loadData();
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
        await this.shoppingItensService.remove(id);
        await this.loadData();
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
      await this.shoppingItensService.getShoppingItensByShoppingId(this.shoppingId()!);
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

  private readonly cadastrarItemCompra = (): void => void this.router.navigate([`/shopping/${this.shoppingId()}/items/new`]);

  private setarButtonCreate(): void {
    this.navBarButtonService.addButton({
      text: 'Adicionar item',
      id: 'add-compra',
      action: this.cadastrarItemCompra.bind(this),
      icon: 'plus',
      visible: true
    });
  }
}
