import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionsRoutingModule } from './actions-routing.module';
import { ActionListComponent } from './action-list/action-list.component';
import { ActionComponent } from './action/action.component';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionFilterComponent } from './action-filter/action-filter.component';
import { ActionSelectComponent } from './action-select/action-select.component';


@NgModule({
  declarations: [
    ActionListComponent,
    ActionComponent,
    ActionFilterComponent,
    ActionSelectComponent
  ],
  imports: [
    CommonModule,
    ActionsRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class ActionsModule { }
