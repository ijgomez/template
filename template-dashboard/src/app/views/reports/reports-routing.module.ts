import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportsListComponent } from './reports-list/reports-list.component';
import { ReportsHomeComponent } from './reports-home/reports-home.component';
import { ReportComponent } from './report/report.component';

const routes: Routes = [
  { path: '', component: ReportsHomeComponent, children: [
    //{ path: '', pathMatch: 'full', redirectTo: 'list'},
    { path: '', component: ReportsListComponent},
    { path: 'list', component: ReportsListComponent},
    { path: 'create', component: ReportComponent},
    { path: 'edit/:id', component: ReportComponent}
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
