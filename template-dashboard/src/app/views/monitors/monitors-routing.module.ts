import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonitorsHomeComponent } from './monitors-home/monitors-home.component';
import { ProcessBackgroundListComponent } from './process-background-list/process-background-list.component';

const routes: Routes = [
  { path: '', component: MonitorsHomeComponent, children: [
    { path: '', component: ProcessBackgroundListComponent},
    { path: 'process', pathMatch: 'full', redirectTo: ''},
  ] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MonitorsRoutingModule { }
