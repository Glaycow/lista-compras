import {JsonPipe} from '@angular/common';
import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {computed} from 'ngxtension/computed';
import {derivedAsync} from 'ngxtension/derived-async';
import {injectParams} from 'ngxtension/inject-params';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {DatePickerModule} from 'primeng/datepicker';
import {FloatLabel} from 'primeng/floatlabel';
import {InputText} from 'primeng/inputtext';
import {tap} from 'rxjs';
import {Compra} from '../../model/compra';
import {CompraService} from '../../service/compra.service';

@Component({
  selector: 'app-form-compra',
  imports: [
    DatePickerModule,
    Card,
    ReactiveFormsModule,
    FloatLabel,
    InputText,
    Button,
    RouterLink
  ],
  templateUrl: './form-compra.component.html',
  styleUrl: './form-compra.component.scss'
})
export default class FormCompraComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly compraService = inject(CompraService);
  protected readonly formulario = this.formBuilder.group({
    nome: this.formBuilder.control<string>('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    data: this.formBuilder.control<Date>(new Date(), [Validators.required])
  });
  compraId = injectParams('id');
  compra = derivedAsync(
    () => this.compraService.buscarPorId(Number(this.compraId())).pipe(
      tap((compra: Compra) => {
        if(compra) {
          this.formulario.patchValue(compra);
        }
      })
    )
  );
  tipoForm = derivedAsync(() => this.compra() ? 1 : 0);

  salvar(): void {
    const compra = new Compra(this.formulario.getRawValue() as Compra);

    if(this.tipoForm() === 1) {
      compra.id = Number(this.compraId());
      this.compraService.atualizar(compra).subscribe({
        next: () => {
          void this.router.navigate(['/..']);
        }
      });
    } else {
      delete compra.id;
      this.compraService.adicionar(compra).subscribe({
        next: () => {
          void this.router.navigate(['/..']);
        }
      });
    }
  }
}
