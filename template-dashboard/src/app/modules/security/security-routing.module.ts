import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, children: [
    { path: 'actions', loadChildren: () => import(/* webpackChunkName: "actions-module" */'./actions/actions.module').then( m => m.ActionsModule ), canActivate: [AuthGuard], data: { action: 'ACTIONS'} },
    { path: 'profiles', loadChildren: () => import(/* webpackChunkName: "profiles-module" */ './profiles/profiles.module').then( m => m.ProfilesModule ), canActivate: [AuthGuard], data: { action: 'PROFILES'} },
    { path: 'users', loadChildren: () => import(/* webpackChunkName: "users-module" */ './users/users.module').then( m => m.UsersModule ), canActivate: [AuthGuard], data: { action: 'USERS'} }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class SecurityRoutingModule { }
