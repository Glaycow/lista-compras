import {inject, Injectable, Signal, signal} from '@angular/core';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {map, Observable} from 'rxjs';
import {Itens} from '../model/itens';

@Injectable({providedIn: 'root'})
export class ItensService {
  private readonly dbService = inject(NgxIndexedDBService);
  private readonly listaItens = signal<Itens[]>([]);

  public listaItens$ = this.listaItens.asReadonly();

  public todosItens(idLista: number): Signal<Itens[]> {
    this.dbService.getAllByIndex<Itens>('itens-compra', 'idCompra', IDBKeyRange.only(idLista))
      .pipe(
        map((itens) => itens.toSorted((a: Itens, b: Itens) => Number(a.pego) - Number(b.pego)))
      ).subscribe({
      next: (itens) => {
        this.listaItens.set(itens);
      }
    });

    return this.listaItens.asReadonly();
  }

  public buscarPorId(id: number): Observable<Itens> {
    return this.dbService.getByID<Itens>('itens-compra', id);
  }

  public adicionar(itens: Itens): Observable<Itens> {
    return this.dbService.add('itens-compra', itens);
  }

  public remover(id: number): Observable<unknown> {
    return this.dbService.delete('itens-compra', id);
  }

  public atualizar(itens: Itens): Observable<Itens> {
   return  this.dbService.update<Itens>('itens-compra', itens);
  }

  public atualizarPego(item: Itens): Observable<Itens> {
    item.pego = !item.pego;
    return this.dbService.update<Itens>('itens-compra', item);
  }
}
