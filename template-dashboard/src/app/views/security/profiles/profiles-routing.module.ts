import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfilesListComponent } from './profiles-list/profiles-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: ProfilesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfilesRoutingModule { }
