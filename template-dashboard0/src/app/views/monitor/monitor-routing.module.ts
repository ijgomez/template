import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonitorListComponent } from './monitor-list/monitor-list.component';
import { MonitorHomeComponent } from './monitor-home/monitor-home.component';

const routes: Routes = [
  { path: '', component: MonitorHomeComponent, children: [
    { path: '', pathMatch: 'full', redirectTo: 'list'},
    { path: 'list', component: MonitorListComponent}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MonitorRoutingModule { }
