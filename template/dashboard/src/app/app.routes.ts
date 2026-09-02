import { Routes } from '@angular/router';

import { actionGuard } from './core/guards/action.guard';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './features/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
        canActivate: [actionGuard],
        data: { actions: ['DASHBOARD_READ'] },
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
        canActivate: [actionGuard],
        data: { actions: ['REPORT_EXECUTE'] },
      },
      {
        path: 'interfaces',
        loadChildren: () => import('./features/interfaces/interfaces.routes').then((m) => m.INTERFACES_ROUTES),
        canActivate: [actionGuard],
        data: { actions: ['INTERFACES_READ'] },
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
      {
        path: 'administration',
        loadChildren: () => import('./features/administration/administration.routes').then((m) => m.ADMINISTRATION_ROUTES),
        canActivate: [actionGuard],
        data: {
          actions: [
            'USER_READ', 'USER_WRITE',
            'PROFILE_READ', 'PROFILE_WRITE',
            'ACTION_READ',
            'SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE',
            'SYSTEM_LOG_READ',
            'CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE',
            'CLUSTER_LOCK_READ',
          ],
        },
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
