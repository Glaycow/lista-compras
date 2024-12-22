import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {NgxIndexedDBService} from 'ngx-indexed-db';
import {finalize, Observable} from 'rxjs';
import {Compra} from '../model/compra';

@Injectable({providedIn: 'root'})
export class CompraService {
  private readonly dbService = inject(NgxIndexedDBService);
  private readonly listaCompras = signal<Compra[]>([])

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
}
