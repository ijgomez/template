import { Routes } from '@angular/router';

import { actionGuard } from '../../core/guards/action.guard';

export const ADMINISTRATION_ROUTES: Routes = [
  {
    path: 'security',
    loadChildren: () => import('./security/security.routes').then((m) => m.SECURITY_ROUTES),
    canActivate: [actionGuard],
    data: { actions: ['USER_READ', 'USER_WRITE', 'PROFILE_READ', 'PROFILE_WRITE', 'ACTION_READ'] },
  },
  {
    path: 'parameters',
    loadComponent: () => import('./parameters/parameters.component').then((m) => m.ParametersComponent),
    canActivate: [actionGuard],
    data: { actions: ['SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE'] },
  },
  {
    path: 'audit',
    loadComponent: () => import('./audit/audit.component').then((m) => m.AuditComponent),
    canActivate: [actionGuard],
    data: { actions: ['SYSTEM_LOG_READ'] },
  },
  {
    path: 'cluster',
    loadChildren: () => import('./cluster/cluster.routes').then((m) => m.CLUSTER_ROUTES),
    canActivate: [actionGuard],
    data: { actions: ['CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE', 'CLUSTER_LOCK_READ'] },
  },
  {
    path: '',
    redirectTo: 'security',
    pathMatch: 'full',
  },
];
