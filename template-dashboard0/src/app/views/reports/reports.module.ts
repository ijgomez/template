import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from 'clarity-angular';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportListComponent } from './report-list/report-list.component';
import { ReportComponent } from './report/report.component';
import { ReportHomeComponent } from './report-home/report-home.component';

import { ReportsService } from '../../services/reports/reports.service';

import { ModalConfirmComponent } from '../components/modal-confirm/modal-confirm.component';
import { ComponentsModule } from '../components/components.module';
import { ReportExecuteComponent } from './report-execute/report-execute.component';

@NgModule({
  imports: [
    CommonModule,
    ReportsRoutingModule,
    FormsModule, ClarityModule, ComponentsModule
  ],
  declarations: [ReportListComponent, ReportComponent, ReportHomeComponent, ReportExecuteComponent],
  entryComponents: [ReportComponent, ReportExecuteComponent],
  providers: [ReportsService]
})
export class ReportsModule { }
