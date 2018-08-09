import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TracesListComponent } from './traces-list/traces-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: TracesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TracesRoutingModule { }
