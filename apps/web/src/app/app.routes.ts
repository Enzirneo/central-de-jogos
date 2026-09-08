import { Routes } from '@angular/router';
import { connectedGuard } from './core/guards/connected-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'sala',
    canActivate: [connectedGuard],
    loadComponent: () => import('./features/sala/sala-page').then((m) => m.SalaPage),
  },
  { path: '**', redirectTo: '' },
];
