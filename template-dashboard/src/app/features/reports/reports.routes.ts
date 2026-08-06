import { Routes } from '@angular/router';

import { ReportsComponent } from './reports.component';

export const REPORTS_ROUTES: Routes = [
  {
    path: ':id',
    component: ReportsComponent,
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
