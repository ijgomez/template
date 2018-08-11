import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfilesListComponent } from './profiles-list/profiles-list.component';

const routes: Routes = [
  //{ path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: '', component: ProfilesListComponent },
  { path: 'list', component: ProfilesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfilesRoutingModule { }
