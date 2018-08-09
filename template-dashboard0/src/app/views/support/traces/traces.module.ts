import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from '../../components/components.module';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from 'clarity-angular';

import { TracesRoutingModule } from './traces-routing.module';
import { TracesListComponent } from './traces-list/traces-list.component';
import { TracesService } from '../../../services/support/traces.service';

@NgModule({
  imports: [
    CommonModule,
    TracesRoutingModule,
    FormsModule, ClarityModule, ComponentsModule
  ],
  declarations: [TracesListComponent],
  providers: [ TracesService]
})
export class TracesModule { }
