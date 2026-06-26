import {CurrencyPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TuiAppearance, TuiButton, TuiError, TuiNumberFormat, TuiTextfield} from '@taiga-ui/core';
import {TuiInputNumber} from '@taiga-ui/kit';
import {TuiCard} from '@taiga-ui/layout';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';

@Component({
  selector: 'app-itens-compras-form',
  imports: [
    TuiAppearance,
    TuiCard,
    ReactiveFormsModule,
    CurrencyPipe,
    TuiButton,
    TuiError,
    TuiTextfield,
    TuiInputNumber,
    TuiNumberFormat,
  ],
  templateUrl: './itens-compras-form.html',
  styleUrl: './itens-compras-form.less'
})
export default class ItensComprasForm implements OnInit, OnDestroy {
  private readonly destroRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly shoppingItensService = inject(ShoppingItensService);
  private readonly navBarButtonService = inject(NavBarButtonService);

  form = this.fb.group({
    nome: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    marca: this.fb.control(''),
    quantidade: this.fb.control(1, [Validators.required, Validators.min(1)]),
    valor: this.fb.control(0.0, [Validators.required, Validators.min(0.01)]),
    itemMarcado: this.fb.control<boolean>(false)
  });
  isEditMode = signal(false);
  isSubmitting = signal(false);
  shoppingId = signal<number>(0);
  currentItemId = signal<number | null>(null);
  isLoading = signal(false);

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

  getTotalValue(): number {
    const quantidade = this.form.controls.quantidade.value || 0;
    const valor = this.form.controls.valor.value || 0;
    return quantidade * valor;
  }

   async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.form.value;
    const item: ShoppingItem = {
      id: this.currentItemId()!,
      shoppingId: this.shoppingId(),
      nome: formValue.nome!,
      marca: formValue.marca || undefined,
      quantidade: formValue.quantidade!,
      valor: formValue.valor!,
      itemMarcado: formValue.itemMarcado!
    };

    if (!this.isEditMode()) {
      await this.create(item);
    } else {
      item.id = this.currentItemId()!;
     await this.update(item);
    }
  }

  goBack(): void {
    void this.router.navigate(['/shopping', this.shoppingId(), 'items']);
  }

  private async loadItem(itemId: number): Promise<void> {
    this.isLoading.set(true);
    await this.shoppingItensService.geyById(itemId)
      .then((item) => {
        if(item) {
          this.form.patchValue({
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

  private async update(formData: ShoppingItem): Promise<void> {
    this.shoppingItensService.update(formData)
      .then(() => {
        this.goBack();
      })
    .catch((error: Error) => {  })
    .finally(() => this.isLoading.set(false));
  }

  private async create(formData: ShoppingItem): Promise<void> {
    this.shoppingItensService.create(formData)
      .then(() => {
        this.goBack();
      })
      .catch(error => {})
      .finally(() => this.isSubmitting.set(false));
  }

  private setTitle(): void {
    this.navBarButtonService.setTitle(this.isEditMode() ? 'Editar Compra' : 'Nova Compra');
  }
}
