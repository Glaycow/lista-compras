import {CurrencyPipe, NgClass} from '@angular/common';
import {Component, inject, linkedSignal, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {injectParams} from 'ngxtension/inject-params';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {DataView} from 'primeng/dataview';
import {Divider} from 'primeng/divider';
import {Itens} from '../../model/itens';
import {ItensService} from '../../service/itens.service';

@Component({
  selector: 'app-lista-itens',
  imports: [
    Card,
    Button,
    RouterLink,
    Divider,
    CurrencyPipe
  ],
  templateUrl: './lista-itens.component.html',
  styleUrl: './lista-itens.component.scss'
})
export default  class ListaItensComponent implements OnInit {
  private readonly itensService = inject(ItensService);
  private readonly router = inject(Router);
  protected compraId = injectParams('id');
  protected itens = this.itensService.listaItens$;
  protected valorTotal = linkedSignal(() => this.itens().reduce((acc, item) => acc + (item.valor * item.quantidade), 0));
  protected valorPego = linkedSignal(() => this.itens().reduce((acc, item) => acc + ((item.valor * item.quantidade) * Number(item.pego)), 0));
  ngOnInit(): void {
    this.buscarListaItens();
    console.log('ListaItensComponent', this.compraId());
  }

  editar(idItem: number): void {
    void this.router.navigate(['itens/compra/', this.compraId(), 'form', 'editar', idItem]);
  }

  pegar(item: Itens): void {
    this.itensService.atualizarPego(item).subscribe({
      next: () => {
        this.buscarListaItens();
      }
    });
  }

  private buscarListaItens(): void {
    this.itensService.todosItens(Number(this.compraId()))();
  }
}
