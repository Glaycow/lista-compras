import {CurrencyPipe} from '@angular/common';
import {computed, Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormField, FormRoot, form, min, minLength, required} from '@angular/forms/signals';
import {ActivatedRoute, Router} from '@angular/router';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {BrCurrencyInput} from '../../../shared/components/br-currency-input/br-currency-input';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ToastService} from '../../../shared/service/toast.service';

interface ItemFormModel {
  nome: string;
  marca: string;
  quantidade: number;
  valor: number;
  itemMarcado: boolean;
}

@Component({
  selector: 'app-itens-compras-form',
  imports: [
    FormField,
    FormRoot,
    BrCurrencyInput,
    CurrencyPipe,
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

  protected readonly model = signal<ItemFormModel>({
    nome: '',
    marca: '',
    quantidade: 1,
    valor: 0,
    itemMarcado: false,
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
      action: async () => {
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
      },
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

  async ngOnInit(): Promise<void> {
    const shoppingId = this.route.snapshot.paramMap.get('shoppingId') as number | null;
    const itemId = this.route.snapshot.paramMap.get('itemId') as number | null;
    if (shoppingId) {
      this.shoppingId.set(shoppingId);
    }

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

  private async loadItem(itemId: number): Promise<void> {
    this.isLoading.set(true);
    await this.shoppingItensService
      .geyById(itemId)
      .then((item) => {
        if (item) {
          this.model.set({
            nome: item.nome,
            marca: item.marca || '',
            quantidade: item.quantidade,
            valor: item.valor,
            itemMarcado: item.itemMarcado,
          });
        }
      })
      .finally(() => this.isLoading.set(false));
  }

  private setTitle(): void {
    this.navBarButtonService.setTitle(
      this.isEditMode() ? 'Editar Compra' : 'Nova Compra',
    );
  }
}
