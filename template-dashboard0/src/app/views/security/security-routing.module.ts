import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecurityHomeComponent } from './security-home/security-home.component';

const routes: Routes = [
  {path: 'security', component: SecurityHomeComponent, children: [
    { path: 'users', loadChildren: 'app/views/security/users/users.module#UsersModule'},
    { path: 'profiles', loadChildren: 'app/views/security/profiles/profiles.module#ProfilesModule'},
    { path: 'actions', loadChildren: 'app/views/security/actions/actions.module#ActionsModule'}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityRoutingModule { }
