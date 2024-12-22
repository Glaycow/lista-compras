import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'compras',
    loadChildren: () => import('./compra/compras.routes').then(m => m.routes),
    data: {
      title: 'Compras'
    }
  },
  {
    path: '',
    redirectTo: 'compras',
    pathMatch: 'full'
  }
];
