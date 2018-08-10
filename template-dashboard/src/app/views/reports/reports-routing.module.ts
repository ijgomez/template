import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportsListComponent } from './reports-list/reports-list.component';
import { ReportsHomeComponent } from './reports-home/reports-home.component';

const routes: Routes = [
  { path: '', component: ReportsHomeComponent, children: [
    { path: '', pathMatch: 'full', redirectTo: 'list'},
    { path: 'list', component: ReportsListComponent}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
