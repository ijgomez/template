import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TracesRoutingModule } from './traces-routing.module';
import { TracesListComponent } from './traces-list/traces-list.component';
import { TracesService } from '../../../services/support/traces.service';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    TracesRoutingModule,
    ComponentsModule
  ],
  declarations: [TracesListComponent],
  providers: [TracesService]
})
export class TracesModule { }
