import {CurrencyPipe, DatePipe} from '@angular/common';
import {computed, Component, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormField, FormRoot, form, min, minLength, required} from '@angular/forms/signals';
import {ActivatedRoute, Router} from '@angular/router';
import {HlmButton} from '@spartan-ng/helm/button';
import {HlmInput} from '@spartan-ng/helm/input';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {BrCurrencyInput} from '../../../shared/components/br-currency-input/br-currency-input';
import {IconComponent} from '../../../shared/components/icon/icon';
import {ITEM_CATEGORIES, ItemCategory} from '../../../shared/model/item-categories';
import {PriceHistory} from '../../../shared/model/PriceHistory';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {FrequentItem, ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ToastService} from '../../../shared/service/toast.service';
import {parseRouteId} from '../../../shared/util/route-id';

interface ItemFormModel {
  nome: string;
  marca: string;
  quantidade: number;
  valor: number;
  itemMarcado: boolean;
  categoria: ItemCategory;
}

@Component({
  selector: 'app-itens-compras-form',
  imports: [
    FormField,
    FormRoot,
    BrCurrencyInput,
    CurrencyPipe,
    DatePipe,
    IconComponent,
    HlmButton,
    HlmInput,
  ],
  templateUrl: './itens-compras-form.html',
  styleUrl: './itens-compras-form.scss',
})
export default class ItensComprasForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly shoppingItensService = inject(ShoppingItensService);
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly toastService = inject(ToastService);

  protected readonly categories = ITEM_CATEGORIES;
  protected readonly frequentItems = signal<FrequentItem[]>([]);
  protected readonly priceHistory = signal<PriceHistory[]>([]);
  protected readonly lastPrice = signal<PriceHistory | undefined>(undefined);

  protected readonly model = signal<ItemFormModel>({
    nome: '',
    marca: '',
    quantidade: 1,
    valor: 0,
    itemMarcado: false,
    categoria: 'Outros',
  });

  protected readonly submitError = signal<string | null>(null);
  protected readonly isExiting = signal(false);

  protected readonly form = form(this.model, (p) => {
    required(p.nome, { message: 'O nome do item é obrigatório' });
    required(p.quantidade, { message: 'A quantidade é obrigatória' });
    required(p.valor, { message: 'O valor do item é obrigatório' });
    minLength(p.nome, 2, { message: 'O nome deve ter pelo menos 2 caracteres' });
    min(p.quantidade, 1, { message: 'A quantidade mínima é 1' });
    min(p.valor, 0.01, { message: 'O valor mínimo é R$ 0,01' });
  }, {
    submission: {
      action: async () => this.save(),
      onInvalid: (field) => {
        field().markAsTouched();
      },
    },
  });

  protected readonly totalValue = computed(() => {
    const m = this.model();
    return (m.quantidade || 0) * (m.valor || 0);
  });

  readonly isEditMode = signal(false);
  readonly shoppingId = signal<number>(0);
  readonly currentItemId = signal<number | null>(null);
  readonly isLoading = signal(false);

  constructor() {
    effect(() => {
      const nome = this.model().nome;
      const marca = this.model().marca;
      if (nome.length >= 2) {
        void this.loadPriceInfo(nome, marca || undefined);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const shoppingId = parseRouteId(this.route.snapshot.paramMap.get('shoppingId'));
    const itemId = parseRouteId(this.route.snapshot.paramMap.get('itemId'));
    if (!shoppingId) {
      void this.router.navigate(['/shopping']);
      return;
    }

    this.shoppingId.set(shoppingId);
    this.frequentItems.set(await this.shoppingItensService.getFrequentItems());

    if (itemId) {
      this.isEditMode.set(true);
      this.currentItemId.set(itemId);
      await this.loadItem(itemId);
    }

    this.setTitle();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  goBack(): void {
    void this.router.navigate(['/shopping', this.shoppingId(), 'items']);
  }

  protected applyFrequentItem(item: FrequentItem): void {
    this.model.update((m) => ({
      ...m,
      nome: item.nome,
      marca: item.marca ?? '',
      valor: item.valor,
      categoria: (item.categoria as ItemCategory) ?? 'Outros',
    }));
  }

  protected applyLastPrice(): void {
    const last = this.lastPrice();
    if (last) {
      this.model.update((m) => ({...m, valor: last.valor}));
    }
  }

  protected async save(): Promise<void> {
    this.submitError.set(null);

    try {
      const m = this.model();
      const item: ShoppingItem = {
        shoppingId: this.shoppingId(),
        nome: m.nome,
        marca: m.marca || undefined,
        quantidade: m.quantidade,
        valor: m.valor,
        itemMarcado: m.itemMarcado,
        categoria: m.categoria,
      };

      if (!this.isEditMode()) {
        await this.shoppingItensService.create(item);
      } else {
        item.id = this.currentItemId()!;
        await this.shoppingItensService.update(item);
      }

      this.isExiting.set(true);
      this.toastService.show(
        this.isEditMode()
          ? 'Item atualizado com sucesso!'
          : 'Item adicionado com sucesso!',
      );
      await new Promise<void>((r) => setTimeout(r, 200));
      this.goBack();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro inesperado ao salvar o item. Tente novamente.';
      this.submitError.set(message);
      throw err;
    }
  }

  protected adjustQuantidade(delta: number): void {
    this.model.update((m) => ({
      ...m,
      quantidade: Math.max(1, Math.floor((Number(m.quantidade) || 0) + delta)),
    }));
  }

  private async loadPriceInfo(nome: string, marca?: string): Promise<void> {
    const [last, history] = await Promise.all([
      this.shoppingItensService.getLastPrice(nome, marca),
      this.shoppingItensService.getPriceHistory(nome, marca),
    ]);
    this.lastPrice.set(last);
    this.priceHistory.set(history);
  }

  private async loadItem(itemId: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const item = await this.shoppingItensService.getById(itemId);
      if (item) {
        this.model.set({
          nome: item.nome,
          marca: item.marca || '',
          quantidade: item.quantidade,
          valor: item.valor,
          itemMarcado: item.itemMarcado,
          categoria: item.categoria ?? 'Outros',
        });
      } else {
        this.goBack();
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private setTitle(): void {
    this.navBarButtonService.setTitle(
      this.isEditMode() ? 'Editar item' : 'Novo item',
    );
  }
}
