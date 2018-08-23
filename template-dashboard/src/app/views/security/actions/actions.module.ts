import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { ActionsRoutingModule } from './actions-routing.module';
import { ActionsListComponent } from './actions-list/actions-list.component';
import { ActionComponent } from './action/action.component';
import { ActionsService } from '../../../services/security/actions.service';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  imports: [
    CommonModule, ReactiveFormsModule,
    ActionsRoutingModule,
    ComponentsModule
  ],
  declarations: [ActionsListComponent, ActionComponent],
  providers: [ActionsService]
})
export class ActionsModule { }
