import { Routes } from '@angular/router';

export const INTERFACES_ROUTES: Routes = [
  {
    path: 'monitor',
    loadComponent: () => import('./pages/interface-list/interface-list.component').then((m) => m.InterfaceListComponent),
  },
  {
    path: 'configuration',
    loadComponent: () => import('./pages/configuration-list/configuration-list.component').then((m) => m.ConfigurationListComponent),
  },
  {
    path: '',
    redirectTo: 'monitor',
    pathMatch: 'full',
  },
];
