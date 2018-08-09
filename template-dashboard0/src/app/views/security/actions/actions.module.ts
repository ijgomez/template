import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionsRoutingModule } from './actions-routing.module';
import { ActionsListComponent } from './actions-list/actions-list.component';

@NgModule({
  imports: [
    CommonModule,
    ActionsRoutingModule
  ],
  declarations: [ActionsListComponent]
})
export class ActionsModule { }
