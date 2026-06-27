import {CurrencyPipe} from '@angular/common';
import {Component, inject, linkedSignal, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-itens-compras-lista',
  imports: [
    CurrencyPipe,
    RouterLink,
    ConfirmDialogComponent,
  ],
  templateUrl: './itens-compras-lista.html',
  styleUrl: './itens-compras-lista.scss'
})
export default class ItensComprasLista implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly route = inject(ActivatedRoute);
  protected readonly shoppingItensService = inject(ShoppingItensService);
  shoppingId = signal<number | null>(null);
  shopping = signal<Shopping | null>(null);
  items = this.shoppingItensService.shoppingItens;
  protected valorTotal = linkedSignal(() => this.items().reduce((acc, item) => acc + (item.valor * item.quantidade), 0));
  protected valorPego = linkedSignal(() => this.items().reduce((acc, item) => acc + ((item.valor * item.quantidade) * Number(item.itemMarcado)), 0));
  isLoading = signal(false);

  // Confirm dialog state
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
    await this.shoppingItensService.updateItemMarcado(item).then(() => this.loadData());
  }

  protected showDeleteConfirm(itemId: number, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteItemId.set(itemId);
    this.confirmDialogVisible.set(true);
  }

  protected async onDeleteConfirmed(): Promise<void> {
    const id = this.pendingDeleteItemId();
    if (id !== null) {
      await this.shoppingItensService.remove(id).then(() => this.loadData());
    }
    this.confirmDialogVisible.set(false);
    this.pendingDeleteItemId.set(null);
  }

  protected onDeleteCancelled(): void {
    this.confirmDialogVisible.set(false);
    this.pendingDeleteItemId.set(null);
  }

  private async getParamsRota(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') as number | null;

    if (id) {
      this.shoppingId.set(id);
      await this.loadData();
    }
    this.setarButtonCreate();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    await this.shoppingItensService.getShoppingById(this.shoppingId()!)
      .then((shopping: Shopping | undefined) => {
        if(shopping) {
          this.shopping.set(shopping);
          this.setTitle(shopping.nome);
        }
      })
      .finally(() => this.isLoading.set(false));

    await this.shoppingItensService.getShoppingItensByShoppingId(this.shoppingId()!);
  }

  private setarUrlBack(): void {
    this.navBarButtonService.setarUrlBack('/shopping');
  }

  private setTitle(title: string): void {
    this.navBarButtonService.setTitle(`lista de compras ${title ?? ''}`);
  }

  private readonly cadastrarItemCompra = (): void => void this.router.navigate([`shopping/${this.shoppingId()}/items/new`]);

  private setarButtonCreate(): void {
    this.navBarButtonService.addButton({
      text: 'Adicionar Compras',
      id: 'add-compra',
      action: this.cadastrarItemCompra.bind(this),
      icon: '@tui.circle-plus',
      visible: true
    });
  }
}
