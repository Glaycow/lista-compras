import {inject, Pipe, PipeTransform} from '@angular/core';
import {map, Observable, of} from 'rxjs';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingService} from '../../../shared/service/shopping-service';

@Pipe({name: 'totalItensShopping'})
export class TotalItensShoppingPipe implements PipeTransform {
  shoppingItensService = inject(ShoppingService);
  async transform(id: number): Promise<number> {
    const value = await this.shoppingItensService.getShoppingItensByShoppingId(id);
    return value.length;
  }

}
