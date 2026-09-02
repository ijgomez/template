import { Routes } from '@angular/router';

export const INTERFACES_ROUTES: Routes = [
  {
    path: 'monitor',
    loadComponent: () => import('./monitor/monitor.component').then((m) => m.MonitorComponent),
  },
  {
    path: 'configuration',
    loadComponent: () => import('./configuration/configuration.component').then((m) => m.ConfigurationComponent),
  },
  {
    path: '',
    redirectTo: 'monitor',
    pathMatch: 'full',
  },
];
