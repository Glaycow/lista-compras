import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TuiDay} from '@taiga-ui/cdk';
import {TuiAppearance, TuiButton, tuiDateFormatProvider, TuiError, TuiTextfield} from '@taiga-ui/core';
import {TuiFieldErrorPipe, TuiInputDate, tuiInputDateOptionsProviderNew} from '@taiga-ui/kit';
import {TuiCard} from '@taiga-ui/layout';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingService} from '../../../shared/service/shopping-service';

@Component({
  selector: 'app-compras-form',
  imports: [
    TuiAppearance,
    TuiCard,
    ReactiveFormsModule,
    TuiFieldErrorPipe,
    AsyncPipe,
    TuiTextfield,
    TuiError,
    TuiInputDate,
    TuiButton
  ],
  templateUrl: './compras-form.html',
  styleUrl: './compras-form.less',
  providers: [
    tuiDateFormatProvider({mode: 'MDY', separator: '/'}),
    tuiInputDateOptionsProviderNew({
      valueTransformer: {
        fromControlValue: (value: Date | null): TuiDay | null =>
          value && TuiDay.fromUtcNativeDate(value),
        toControlValue: (value: TuiDay | null): Date | null =>
          value?.toUtcNativeDate() || null,
      },
    })
  ],
})
export default class ComprasForm implements OnInit {
  private readonly destroRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly databaseService = inject(ShoppingService);

  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  currentShoppingId = signal<number | null>(null);
  form = this.fb.group({
    nome: this.fb.control<string | null>('', [Validators.required, Validators.minLength(2)]),
    data: this.fb.control<Date | null>(new Date(), [Validators.required])
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') as number | null;
    if (id) {
      this.isEditMode.set(true);
      this.currentShoppingId.set(id);
      await this.loadShopping(id);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();
    const data = formValue.data;
    data!.setDate(data!.getDate() + 1);
    formValue.data = data;

    if (this.isEditMode()) {
      const shopping: Shopping = {
        id: this.currentShoppingId()!,
        nome: formValue.nome!,
        data: formValue.data!
      };
      await this.update(shopping);
    } else {
      await this.create({nome: formValue.nome!, data: formValue.data!})
    }
  }

  goBack(): void {
    void this.router.navigate(['/shopping']);
  }

  private async loadShopping(id: number): Promise<void> {
    this.isLoading.set(true);
    const shopping = await this.databaseService.getById(id);
    if(shopping) {
      this.form.patchValue({
        nome: shopping.nome,
        data: new Date(shopping.data)
      });
    }
  }

  private async update(formData: Shopping): Promise<void> {
    await this.databaseService.update(formData)
      .then((teste) => {
        console.log(teste)
        this.goBack();
      })
      .catch((error: Error) => { console.error(error) })
      .finally(() => this.isLoading.set(false));
  }

  private async create(formData: Shopping): Promise<void> {
    await this.databaseService.create(formData).
      then(() => {
        this.goBack();
      })
      .catch(error => console.log(error))
      .finally(() => this.isSubmitting.set(false));
  }
}
