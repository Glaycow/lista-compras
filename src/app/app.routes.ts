import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/shopping', pathMatch: 'full' },
  { path: 'shopping', loadComponent: () => import('./pages/compras/compras-lista/compras-lista') },
  { path: 'shopping/new', loadComponent: () => import('./pages/compras/compras-form/compras-form') },
  { path: 'shopping/:id/edit', loadComponent: () => import('./pages/compras/compras-form/compras-form') },
  { path: 'shopping/:id/items', loadComponent: () => import('./pages/itens-compras/itens-compras-lista/itens-compras-lista') },
  { path: 'shopping/:shoppingId/items/new', loadComponent: () => import('./pages/itens-compras/itens-compras-form/itens-compras-form') },
  { path: 'shopping/:shoppingId/items/:itemId/edit', loadComponent: () => import('./pages/itens-compras/itens-compras-form/itens-compras-form') },
  { path: '**', redirectTo: '/shopping' }
];
