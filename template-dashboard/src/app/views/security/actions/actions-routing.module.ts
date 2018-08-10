import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ActionsListComponent } from './actions-list/actions-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: ActionsListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActionsRoutingModule { }
