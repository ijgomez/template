import { Routes } from '@angular/router';

import { actionGuard } from '../../../core/guards/action.guard';

export const CLUSTER_ROUTES: Routes = [
  {
    path: 'nodes',
    loadComponent: () => import('./nodes/node-list/node-list.component').then((m) => m.NodeListComponent),
    canActivate: [actionGuard],
    data: { actions: ['CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE'] },
  },
  {
    path: 'blocks',
    loadComponent: () => import('./blocks/block-list/block-list.component').then((m) => m.BlockListComponent),
    canActivate: [actionGuard],
    data: { actions: ['CLUSTER_LOCK_READ'] },
  },
  {
    path: '',
    redirectTo: 'nodes',
    pathMatch: 'full',
  },
];
