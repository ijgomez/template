import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportHomeComponent } from './report-home/report-home.component';
import { ReportListComponent } from './report-list/report-list.component';

const routes: Routes = [
  { path: '', component: ReportHomeComponent, children: [
    { path: '', pathMatch: 'full', redirectTo: 'list'},
    { path: 'list', component: ReportListComponent}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
