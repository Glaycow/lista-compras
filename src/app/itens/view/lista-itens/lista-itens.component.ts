import {DatePipe, NgClass} from '@angular/common';
import {Component, inject, linkedSignal, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {derivedAsync} from 'ngxtension/derived-async';
import {injectParams} from 'ngxtension/inject-params';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {DataView} from 'primeng/dataview';
import {Itens} from '../../model/itens';
import {ItensService} from '../../service/itens.service';

@Component({
  selector: 'app-lista-itens',
  imports: [
    Card,
    DataView,
    Button,
    RouterLink,
    NgClass,
    DatePipe
  ],
  templateUrl: './lista-itens.component.html',
  styleUrl: './lista-itens.component.scss'
})
export default  class ListaItensComponent {
  private itensService = inject(ItensService);
  private router = inject(Router);
  protected compraId = injectParams('id');
  protected itens= derivedAsync(
    () => this.itensService.todosItens(Number(this.compraId())),
    {
      initialValue: []
    }
  );

  editar(idItem: number): void {
    ///itens/compra/1/form/editar/1
    void this.router.navigate(['itens/compra/', this.compraId(), 'form', 'editar', idItem]);
  }

}
