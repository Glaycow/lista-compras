import {DatePipe, NgClass} from '@angular/common';
import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {DataView} from 'primeng/dataview';
import {CompraService} from '../../service/compra.service';

@Component({
  selector: 'app-lista-compra',
  imports: [
    Button,
    DataView,
    NgClass,
    DatePipe,
    Card,
    RouterLink
  ],
  templateUrl: './lista-compra.component.html',
  styleUrl: './lista-compra.component.scss'
})
export default class ListaCompraComponent {
  private readonly router = inject(Router);
  private readonly compraService = inject(CompraService);
  public compras$ = this.compraService.todasListas();

  editar(id: number): void {
   void this.router.navigate(['compras/form/editar/', id,]);
  }
}
