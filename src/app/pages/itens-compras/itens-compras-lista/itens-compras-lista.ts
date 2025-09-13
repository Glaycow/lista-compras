import {CurrencyPipe} from '@angular/common';
import {Component, inject, linkedSignal, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TuiAlertService, TuiAppearance, TuiButton, TuiIcon, TuiSurface} from '@taiga-ui/core';
import {TUI_CONFIRM, TuiCheckbox, TuiConfirmData} from '@taiga-ui/kit';
import {TuiCard} from '@taiga-ui/layout';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ShoppingService} from '../../../shared/service/shopping-service';

@Component({
  selector: 'app-itens-compras-lista',
  imports: [
    CurrencyPipe,
    TuiSurface,
    TuiIcon,
    TuiButton,
    RouterLink,
    TuiAppearance,
    TuiCard,
    ReactiveFormsModule,
    TuiCheckbox,
    FormsModule
  ],
  templateUrl: './itens-compras-lista.html',
  styleUrl: './itens-compras-lista.less'
})
export default class ItensComprasLista implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly route = inject(ActivatedRoute);
  protected readonly shoppingItensService = inject(ShoppingItensService);
  private readonly alerts = inject(TuiAlertService);
  shoppingId = signal<number | null>(null);
  shopping = signal<Shopping | null>(null);
  items = this.shoppingItensService.shoppingItens;
  protected valorTotal = linkedSignal(() => this.items().reduce((acc, item) => acc + (item.valor * item.quantidade), 0));
  protected valorPego = linkedSignal(() => this.items().reduce((acc, item) => acc + ((item.valor * item.quantidade) * Number(item.itemMarcado)), 0));
  isLoading = signal(false);

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

  deleteItem(itemId: number, event: Event): void {
    event.stopPropagation();
    const item = this.items().find(item => item.id === itemId);
    const data: TuiConfirmData = {
      yes: 'Sim',
      no: 'Não',
      content: `Deseja realmente excluir o item ${item?.nome}?`,
    }

    this.alerts
      .open<boolean>(TUI_CONFIRM, {
        label: 'Deseja realmente excluir o item ?',
        data,
        closeable: false,
        autoClose: 5000
      })
      .subscribe(async response => {
       if(response) {
         await this.shoppingItensService.remove(itemId);
         await this.loadData();
       }
      })
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
      tuiSlot: "left",
      action: this.cadastrarItemCompra.bind(this),
      icon: '@tui.circle-plus',
      visible: true
    });
  }
}
