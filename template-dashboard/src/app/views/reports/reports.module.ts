import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportHomeComponent } from './report-home/report-home.component';
import { ReportListComponent } from './report-list/report-list.component';
import { ReportComponent } from './report/report.component';

@NgModule({
  imports: [
    CommonModule,
    ReportsRoutingModule
  ],
  declarations: [ReportHomeComponent, ReportListComponent, ReportComponent]
})
export class ReportsModule { }
