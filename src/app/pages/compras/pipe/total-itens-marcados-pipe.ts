import {inject, Pipe, PipeTransform} from '@angular/core';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingService} from '../../../shared/service/shopping-service';

@Pipe({name: 'totalItensMarcados'})
export class TotalItensMarcadosPipe implements PipeTransform {
  shoppingItensService = inject(ShoppingService);
  async transform(id: number): Promise<number> {
    return await this.shoppingItensService.getShoppingItensByShoppingId(id).then(
      (item: ShoppingItem[]) => {
        return item.reduce((acc, item) => acc + ((item.valor * item.quantidade) * Number(item.itemMarcado)), 0);
      }
    );
  }

}
