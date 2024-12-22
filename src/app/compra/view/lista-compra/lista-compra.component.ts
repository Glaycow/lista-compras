import {DatePipe, JsonPipe, NgClass} from '@angular/common';
import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Button} from 'primeng/button';
import {DataView} from 'primeng/dataview';
import {CompraService} from '../../service/compra.service';

@Component({
  selector: 'app-lista-compra',
  imports: [
    JsonPipe,
    Button,
    DataView,
    NgClass,
    DatePipe
  ],
  templateUrl: './lista-compra.component.html',
  styleUrl: './lista-compra.component.scss'
})
export default class ListaCompraComponent {
  private readonly compraService = inject(CompraService);
  public compras$ = this.compraService.todasListas();

  add(): void {
  }
}
