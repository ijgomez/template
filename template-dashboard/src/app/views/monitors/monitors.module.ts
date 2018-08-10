import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorsRoutingModule } from './monitors-routing.module';
import { MonitorsHomeComponent } from './monitors-home/monitors-home.component';
import { ProcessBackgroundListComponent } from './process-background-list/process-background-list.component';

@NgModule({
  imports: [
    CommonModule,
    MonitorsRoutingModule
  ],
  declarations: [MonitorsHomeComponent, ProcessBackgroundListComponent]
})
export class MonitorsModule { }
