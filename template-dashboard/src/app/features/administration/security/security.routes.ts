import { Routes } from '@angular/router';

import { actionGuard } from '../../../core/guards/action.guard';

export const SECURITY_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/users.component').then((m) => m.UsersComponent),
    canActivate: [actionGuard],
    data: { actions: ['USER_READ', 'USER_WRITE'] },
  },
  {
    path: 'profiles',
    loadComponent: () => import('./profiles/profiles.component').then((m) => m.ProfilesComponent),
    canActivate: [actionGuard],
    data: { actions: ['PROFILE_READ', 'PROFILE_WRITE'] },
  },
  {
    path: 'actions',
    loadComponent: () => import('./actions/actions.component').then((m) => m.ActionsComponent),
    canActivate: [actionGuard],
    data: { actions: ['ACTION_READ'] },
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
];
