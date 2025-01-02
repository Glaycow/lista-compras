import {DatePipe, NgClass} from '@angular/common';
import {Component, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {DataView} from 'primeng/dataview';
import {Itens} from '../../model/itens';

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
  itens$= signal<Itens[]>([]);

  editar(idItem: number): void {}
}
