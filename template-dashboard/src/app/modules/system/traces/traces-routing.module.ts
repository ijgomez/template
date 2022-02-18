import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TracesListComponent } from './traces-list/traces-list.component';
import { TracesComponent } from './traces/traces.component';

const routes: Routes = [
  { path: '', component: TracesListComponent },
  { path: 'view/:id', component: TracesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TracesRoutingModule { }
