import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionsRoutingModule } from './actions-routing.module';
import { ActionListComponent } from './action-list/action-list.component';
import { ActionComponent } from './action/action.component';

@NgModule({
  imports: [
    CommonModule,
    ActionsRoutingModule
  ],
  declarations: [ActionListComponent, ActionComponent]
})
export class ActionsModule { }
