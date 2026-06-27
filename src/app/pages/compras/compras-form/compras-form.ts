import {Component, inject, OnInit, signal} from '@angular/core';
import {FormField, FormRoot, form, required, minLength} from '@angular/forms/signals';
import {ActivatedRoute, Router} from '@angular/router';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingService} from '../../../shared/service/shopping-service';
import {ToastService} from '../../../shared/service/toast.service';

interface ShoppingFormModel {
  nome: string;
  data: string;
}

@Component({
  selector: 'app-compras-form',
  imports: [
    FormField,
    FormRoot,
  ],
  templateUrl: './compras-form.html',
  styleUrl: './compras-form.scss',
})
export default class ComprasForm implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly databaseService = inject(ShoppingService);
  private readonly toastService = inject(ToastService);

  readonly isEditMode = signal(false);
  readonly isLoading = signal(false);
  readonly currentShoppingId = signal<number | null>(null);

  protected readonly model = signal<ShoppingFormModel>({
    nome: '',
    data: new Date().toISOString().split('T')[0],
  });

  protected readonly submitError = signal<string | null>(null);
  protected readonly isExiting = signal(false);

  protected readonly form = form(this.model, (p) => {
    required(p.nome, { message: 'O nome da lista é obrigatório' });
    minLength(p.nome, 2, { message: 'O nome deve ter pelo menos 2 caracteres' });
    required(p.data, { message: 'A data é obrigatória' });
  }, {
    submission: {
      action: async () => {
        this.submitError.set(null);

        try {
          const m = this.model();

          const shopping: Shopping = {
            id: this.isEditMode() ? this.currentShoppingId()! : undefined,
            nome: m.nome,
            data: new Date(m.data),
          };

          if (this.isEditMode()) {
            await this.databaseService.update(shopping);
          } else {
            await this.databaseService.create(shopping);
          }

          this.isExiting.set(true);
          this.toastService.show(
            this.isEditMode()
              ? 'Lista atualizada com sucesso!'
              : 'Lista criada com sucesso!',
          );
          await new Promise<void>((r) => setTimeout(r, 200));
          this.goBack();
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Ocorreu um erro inesperado ao salvar a lista. Tente novamente.';
          this.submitError.set(message);
          throw err;
        }
      },
      onInvalid: (field) => {
        field().markAsTouched();
      },
    },
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') as number | null;
    if (id) {
      this.isEditMode.set(true);
      this.currentShoppingId.set(id);
      await this.loadShopping(id);
    }
  }

  goBack(): void {
    void this.router.navigate(['/shopping']);
  }

  private async loadShopping(id: number): Promise<void> {
    this.isLoading.set(true);
    const shopping = await this.databaseService.getById(id);
    if (shopping) {
      this.model.set({
        nome: shopping.nome,
        data: new Date(shopping.data).toISOString().split('T')[0],
      });
    }
    this.isLoading.set(false);
  }
}
