import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorRoutingModule } from './monitor-routing.module';
import { MonitorListComponent } from './monitor-list/monitor-list.component';
import { MonitorHomeComponent } from './monitor-home/monitor-home.component';

@NgModule({
  imports: [
    CommonModule,
    MonitorRoutingModule
  ],
  declarations: [MonitorListComponent, MonitorHomeComponent]
})
export class MonitorModule { }
