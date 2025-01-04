import {CurrencyPipe} from '@angular/common';
import {Component, inject, linkedSignal, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {derivedAsync} from 'ngxtension/derived-async';
import {injectParams} from 'ngxtension/inject-params';
import {ConfirmationService} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {ConfirmDialog, ConfirmDialogModule} from 'primeng/confirmdialog';
import {Divider} from 'primeng/divider';
import {Toolbar} from 'primeng/toolbar';
import {CompraService} from '../../../compra/service/compra.service';
import {Itens} from '../../model/itens';
import {ItensService} from '../../service/itens.service';

@Component({
  selector: 'app-lista-itens',
  imports: [
    Card,
    Button,
    RouterLink,
    Divider,
    CurrencyPipe,
    Toolbar,
    ConfirmDialogModule
  ],
  templateUrl: './lista-itens.component.html',
  styleUrl: './lista-itens.component.scss',
  providers: [ConfirmationService]
})
export default  class ListaItensComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly itensService = inject(ItensService);
  private readonly comprasService = inject(CompraService);
  private readonly router = inject(Router);
  protected compraId = injectParams('id');
  protected compra = derivedAsync(() => this.comprasService.buscarPorId(Number(this.compraId())));
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

  apagar(idCompra: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja apagar o item?',
      header: 'Confirmação',
      acceptButtonProps: {label: 'Sim', severity: 'danger'},
      rejectButtonProps: {label: 'Não', severity: 'secondary'},
      accept: () => {
        this.itensService.remover(idCompra).subscribe({
          next: () => {
            this.buscarListaItens();
          }
        });
      }
    })
  }

  private buscarListaItens(): void {
    this.itensService.todosItens(Number(this.compraId()))();
  }
}
