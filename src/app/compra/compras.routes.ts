import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'lista',
        loadComponent: () => import('./view/lista-compra/lista-compra.component')
      },
      {
        path: 'form/novo',
        loadComponent: () => import('./view/form-compra/form-compra.component')
      },
      {
        path: 'form/editar/:id',
        loadComponent: () => import('./view/form-compra/form-compra.component')
      },
      {
        path: '',
        redirectTo: 'lista',
        pathMatch: 'full'
      }
    ]
  }
];
