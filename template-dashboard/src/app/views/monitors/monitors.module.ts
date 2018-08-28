import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorsRoutingModule } from './monitors-routing.module';
import { MonitorsHomeComponent } from './monitors-home/monitors-home.component';
import { ProcessBackgroundListComponent } from './process-background-list/process-background-list.component';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    MonitorsRoutingModule, ComponentsModule
  ],
  declarations: [MonitorsHomeComponent, ProcessBackgroundListComponent]
})
export class MonitorsModule { }
