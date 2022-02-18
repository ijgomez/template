import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TracesRoutingModule } from './traces-routing.module';
import { TracesListComponent } from './traces-list/traces-list.component';
import { TracesComponent } from './traces/traces.component';
import { TracesFilterComponent } from './traces-filter/traces-filter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    TracesListComponent,
    TracesComponent,
    TracesFilterComponent
  ],
  imports: [
    CommonModule,
    TracesRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class TracesModule { }
