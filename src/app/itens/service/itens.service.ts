import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {Observable} from 'rxjs';
import {Itens} from '../model/itens';

@Injectable({providedIn: 'root'})
export class ItensService {
  private readonly dbService = inject(NgxIndexedDBService);
  private readonly listaItens = signal<Itens[]>([])

  public todosItens(idLista: number): Observable<Itens[]> {
    return this.dbService.getAllByIndex<Itens>('itens-compra', 'idCompra', IDBKeyRange.only(idLista));
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
}
