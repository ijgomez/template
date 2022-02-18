import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ReportsRoutingModule } from './reports-routing.module';
import { HomeComponent } from './home/home.component';
import { ReportFilterComponent } from './report-filter/report-filter.component';
import { ReportComponent } from './report/report.component';
import { ReportListComponent } from './report-list/report-list.component';
import { SharedModule } from '../../shared/shared.module';
import { ReportExecuteComponent } from './report-execute/report-execute.component';


@NgModule({
  declarations: [
    HomeComponent,
    ReportFilterComponent,
    ReportComponent,
    ReportListComponent,
    ReportExecuteComponent
  ],
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    ReportsRoutingModule,
    SharedModule
  ]
})
export class ReportsModule { }
