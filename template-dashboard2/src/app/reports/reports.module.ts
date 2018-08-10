import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportListComponent } from './report-list/report-list.component';

@NgModule({
  imports: [
    CommonModule,
    ReportsRoutingModule
  ],
  declarations: [ReportListComponent]
})
export class ReportsModule { }
