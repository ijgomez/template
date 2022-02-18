import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActionListComponent } from './action-list/action-list.component';
import { ActionComponent } from './action/action.component';

const routes: Routes = [
  { path: '', component: ActionListComponent },
  { path: 'create', component: ActionComponent },
  { path: 'view/:id', component: ActionComponent },
  { path: 'edit/:id', component: ActionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActionsRoutingModule { }
