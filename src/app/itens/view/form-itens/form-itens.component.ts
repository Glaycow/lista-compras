import {Location} from '@angular/common';
import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {derivedAsync} from 'ngxtension/derived-async';
import {injectParams} from 'ngxtension/inject-params';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {FloatLabel} from 'primeng/floatlabel';
import {InputNumber} from 'primeng/inputnumber';
import {InputText} from 'primeng/inputtext';
import {tap} from 'rxjs';
import {Itens} from '../../model/itens';
import {ItensService} from '../../service/itens.service';

@Component({
  selector: 'app-form-itens',
  imports: [
    Button,
    Card,
    FloatLabel,
    InputText,
    ReactiveFormsModule,
    RouterLink,
    InputNumber
  ],
  templateUrl: './form-itens.component.html',
  styleUrl: './form-itens.component.scss'
})
export default class FormItensComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly itemService = inject(ItensService);
  private readonly location = inject(Location);
  protected readonly formulario = this.formBuilder.group({
    id: this.formBuilder.control<number | null>(null),
    idCompra: this.formBuilder.control<number | null>(null, [Validators.required]),
    nome: this.formBuilder.control<string>('', [Validators.required]),
    marca: this.formBuilder.control<string | null>(null, []),
    valor: this.formBuilder.control<number | null>(null, [Validators.required]),
    quantidade: this.formBuilder.control<number>(0, [Validators.required, Validators.min(1)]),
    pego: this.formBuilder.control<boolean>(false, [])
  });
  protected compraId = injectParams('id');
  protected itemId = injectParams('idItem');
  compra = derivedAsync(
    () => this.itemService.buscarPorId(Number(this.itemId())).pipe(
      tap((compra: Itens) => {
        if(compra) {
          this.formulario.patchValue(compra);
        }
        this.formulario.controls.idCompra.setValue(Number(this.compraId()));
      })
    )
  );
  tipoForm = derivedAsync(() => this.itemId() ? 1 : 0);

  constructor() {
    this.formulario.controls.idCompra.setValue(Number(this.compraId()));
  }

  salvar(): void {
    const item = new Itens(this.formulario.getRawValue() as Itens);
    item.idCompra = Number(this.compraId());
    if(this.tipoForm() === 1) {
      this.itemService.atualizar(item).subscribe({
        next: () => {
          this.voltar();
        }
      });
    } else {
      delete item.id;
      this.itemService.adicionar(item).subscribe({
        next: () => {
          this.voltar();
        }
      });
    }
  }

  public voltar(): void {
    this.location.back();
  }
}
