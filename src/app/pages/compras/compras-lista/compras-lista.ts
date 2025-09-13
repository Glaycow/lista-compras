import {AsyncPipe, CurrencyPipe, DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {TuiAlertService, TuiAppearance, TuiButton, TuiIcon, TuiSurface} from '@taiga-ui/core';
import {TUI_CONFIRM, TuiConfirmData} from '@taiga-ui/kit';
import {TuiCard} from '@taiga-ui/layout';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingService} from '../../../shared/service/shopping-service';
import {TotalItensMarcadosPipe} from '../pipe/total-itens-marcados-pipe';
import {TotalItensShoppingPipe} from '../pipe/total-itens-shopping-pipe';

@Component({
  selector: 'app-compras-lista',
  imports: [
    TuiButton,
    TuiIcon,
    RouterLink,
    CurrencyPipe,
    TuiAppearance,
    TuiCard,
    TuiSurface,
    DatePipe,
    TotalItensShoppingPipe,
    AsyncPipe,
    TotalItensMarcadosPipe,
  ],
  templateUrl: './compras-lista.html',
  styleUrl: './compras-lista.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComprasLista implements OnInit, OnDestroy {
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly shoppingService = inject(ShoppingService);
  private readonly alerts = inject(TuiAlertService);
  private readonly router = inject(Router);
  shoppings = toSignal<Shopping[] | undefined>(this.shoppingService.shopping);
  existeShopping = computed(() => this.shoppings()?.length === 0);

  ngOnInit(): void {
    this.setarButtonCreate();
    this.setTitle();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  async deleteShopping(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    const listaCompra = this.shoppings()!.find(shopping => shopping.id === id);
    const data: TuiConfirmData = {
      yes: 'Sim',
      no: 'Não',
      content: `Deseja realmente excluir a lista de compras ${listaCompra?.nome}?`,
    };

    this.alerts
      .open<boolean>(TUI_CONFIRM, {
        label: 'Deseja realmente excluir a lista de compras ?',
        data,
        closeable: false,
        autoClose: 5000
      })
      .subscribe(async response => {
       if(response) {
         await this.shoppingService.remove(id);
       }
      });
  }

  private readonly createShopping = (): void => void this.router.navigate(['shopping/new']);


  private setarButtonCreate(): void {
    this.navBarButtonService.addButton({
      text: 'Adicionar Compras',
      id: 'add-compra',
      tuiSlot: "left",
      action: this.createShopping.bind(this),
      icon: '@tui.circle-plus',
      visible: true
    });
  }

  private setTitle(): void {
    this.navBarButtonService.setTitle('Compras');
  }
}
