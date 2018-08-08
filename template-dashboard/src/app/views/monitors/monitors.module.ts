import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorsRoutingModule } from './monitors-routing.module';
import { MonitorHomeComponent } from './monitor-home/monitor-home.component';
import { ProcessBackgroundListComponent } from './process-background-list/process-background-list.component';

@NgModule({
  imports: [
    CommonModule,
    MonitorsRoutingModule
  ],
  declarations: [MonitorHomeComponent, ProcessBackgroundListComponent]
})
export class MonitorsModule { }
