import { Routes } from '@angular/router';

import { actionGuard } from '../../../core/guards/action.guard';

export const CLUSTER_ROUTES: Routes = [
  {
    path: 'nodes',
    loadComponent: () => import('./nodes/nodes.component').then((m) => m.NodesComponent),
    canActivate: [actionGuard],
    data: { actions: ['CLUSTER_NODE_READ', 'CLUSTER_NODE_WRITE'] },
  },
  {
    path: 'blocks',
    loadComponent: () => import('./blocks/blocks.component').then((m) => m.BlocksComponent),
    canActivate: [actionGuard],
    data: { actions: ['CLUSTER_LOCK_READ'] },
  },
  {
    path: '',
    redirectTo: 'nodes',
    pathMatch: 'full',
  },
];
