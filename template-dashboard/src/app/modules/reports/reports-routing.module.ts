import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ReportExecuteComponent } from './report-execute/report-execute.component';
import { ReportListComponent } from './report-list/report-list.component';
import { ReportComponent } from './report/report.component';

const routes: Routes = [
  { path: '', component: ReportListComponent },
  { path: 'create', component: ReportComponent },
  { path: 'view/:id', component: ReportComponent },
  { path: 'edit/:id', component: ReportComponent },
  { path: 'exec/:id', component: ReportExecuteComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
