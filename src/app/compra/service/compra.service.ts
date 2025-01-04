import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {combineLatest, finalize, forkJoin, map, Observable, of} from 'rxjs';
import {ItensService} from '../../itens/service/itens.service';
import {Compra} from '../model/compra';

@Injectable({providedIn: 'root'})
export class CompraService {
  private readonly dbService = inject(NgxIndexedDBService);
  private readonly listaCompras = signal<Compra[]>([]);
  private readonly itensService = inject(ItensService);

  public todasListas(): WritableSignal<Compra[]> {
    this.dbService.getAll<Compra>('compra').subscribe({
      next: (compras: Compra[]) => {
        this.listaCompras.set(compras);
      }
    });
    return this.listaCompras;
  }

  public adicionar(compra: Compra): Observable<Compra> {
    return this.dbService.add('compra', compra)
      .pipe(
        finalize(() => {
          this.todasListas();
        })
      );
  }

  public remover(id: number): Observable<unknown> {
    const itens = this.itensService.todosItens(id);
    let ids: number[] = [];
    if (itens().length > 0) {
      ids = itens().map(item => item.id!);

      return forkJoin({
        compra: this.dbService.delete('compra', id).pipe(finalize(() => this.todasListas())),
        itens: this.dbService.bulkDelete('itens-compra', ids)
      });
    }

    return this.dbService.delete('compra', id).pipe(finalize(() => this.todasListas()));
  }

  public atualizar(compra: Compra): Observable<unknown> {
    return this.dbService.update<Compra>('compra', compra)
      .pipe(
        finalize(() => {
          this.todasListas();
        })
      );
  }

  public buscarPorId(id: number): Observable<Compra> {
    return this.dbService.getByID<Compra>('compra', id);
  }
}
