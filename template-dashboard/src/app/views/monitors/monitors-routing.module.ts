import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonitorsHomeComponent } from './monitors-home/monitors-home.component';

const routes: Routes = [
  { path: '', component: MonitorsHomeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MonitorsRoutingModule { }
