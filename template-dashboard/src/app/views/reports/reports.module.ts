import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsListComponent } from './reports-list/reports-list.component';
import { ReportsHomeComponent } from './reports-home/reports-home.component';
import { ReportComponent } from './report/report.component';
import { ReportExecuteComponent } from './report-execute/report-execute.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReportsRoutingModule
  ],
  declarations: [ReportsListComponent, ReportsHomeComponent, ReportComponent, ReportExecuteComponent]
})
export class ReportsModule { }
