import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorsRoutingModule } from './monitors-routing.module';
import { MonitorsHomeComponent } from './monitors-home/monitors-home.component';

@NgModule({
  imports: [
    CommonModule,
    MonitorsRoutingModule
  ],
  declarations: [MonitorsHomeComponent]
})
export class MonitorsModule { }
