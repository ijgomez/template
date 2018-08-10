import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TracesRoutingModule } from './traces-routing.module';
import { TracesListComponent } from './traces-list/traces-list.component';

@NgModule({
  imports: [
    CommonModule,
    TracesRoutingModule
  ],
  declarations: [TracesListComponent]
})
export class TracesModule { }
