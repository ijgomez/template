import { Routes } from '@angular/router';

import { actionGuard } from '../../../core/guards/action.guard';

export const SECURITY_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/user-list/user-list.component').then((m) => m.UserListComponent),
    canActivate: [actionGuard],
    data: { actions: ['USER_READ', 'USER_WRITE'] },
  },
  {
    path: 'profiles',
    loadComponent: () => import('./profiles/profile-list/profile-list.component').then((m) => m.ProfileListComponent),
    canActivate: [actionGuard],
    data: { actions: ['PROFILE_READ', 'PROFILE_WRITE'] },
  },
  {
    path: 'actions',
    loadComponent: () => import('./actions/action-list/action-list.component').then((m) => m.ActionListComponent),
    canActivate: [actionGuard],
    data: { actions: ['ACTION_READ'] },
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
];
