import { Routes } from '@angular/router';

import { ReportListComponent } from './report-list/report-list.component';

export const REPORTS_ROUTES: Routes = [
  {
    path: ':id',
    component: ReportListComponent,
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
