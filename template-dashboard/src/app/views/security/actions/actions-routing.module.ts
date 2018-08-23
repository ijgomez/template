import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ActionsListComponent } from './actions-list/actions-list.component';
import { ActionComponent } from './action/action.component';

const routes: Routes = [
  { path: '', component: ActionsListComponent },
  { path: 'create', component: ActionComponent },
  { path: 'edit/:id', component: ActionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActionsRoutingModule { }
