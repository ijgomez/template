import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsListComponent } from './reports-list/reports-list.component';
import { ReportsHomeComponent } from './reports-home/reports-home.component';
import { ReportComponent } from './report/report.component';
import { ReportExecuteComponent } from './report-execute/report-execute.component';
import { ComponentsModule } from '../components/components.module';
import { ReportsService } from '../../services/reports/reports.service';
import { QuestionControlService } from '../../services/commons/question-control.service';

@NgModule({
  imports: [
    CommonModule, HttpModule, ReactiveFormsModule,
    ReportsRoutingModule,
    ComponentsModule
  ],
  declarations: [ReportsListComponent, ReportsHomeComponent, ReportComponent,
    ReportExecuteComponent],
  providers: [ReportsService]
})
export class ReportsModule { }
