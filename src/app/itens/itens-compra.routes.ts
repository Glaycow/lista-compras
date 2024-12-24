import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id/lista',
        loadComponent: () => import('./view/lista-itens/lista-itens.component')
      },
      {
        path: ':id/form/novo',
        loadComponent: () => import('./view/form-itens/form-itens.component')
      },
      {
        path: ':id/form/editar/:idItem',
        loadComponent: () => import('./view/form-itens/form-itens.component')
      },
      {
        path: '',
        redirectTo: 'lista',
        pathMatch: 'full'
      }
    ]
  }
];
