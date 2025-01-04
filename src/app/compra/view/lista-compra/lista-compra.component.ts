import {DatePipe, NgClass} from '@angular/common';
import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {ConfirmationService} from 'primeng/api';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {ConfirmDialog} from 'primeng/confirmdialog';
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
    RouterLink,
    ConfirmDialog
  ],
  templateUrl: './lista-compra.component.html',
  styleUrl: './lista-compra.component.scss',
  providers: [ConfirmationService]
})
export default class ListaCompraComponent {
  private readonly router = inject(Router);
  private readonly compraService = inject(CompraService);
  private readonly confirmationService = inject(ConfirmationService);
  public compras$ = this.compraService.todasListas();

  editar(id: number): void {
   void this.router.navigate(['compras/form/editar/', id,]);
  }

  apagar(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja apagar a compra?',
      header: 'Confirmação',
      acceptButtonProps: {label: 'Sim', severity: 'danger'},
      rejectButtonProps: {label: 'Não', severity: 'secondary'},
      accept: () => {
        this.compraService.remover(id).subscribe({
          next: () => {
            this.compras$ = this.compraService.todasListas();
          }
        });
      }
    })
  }
}
