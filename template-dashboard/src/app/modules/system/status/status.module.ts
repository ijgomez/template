import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatusRoutingModule } from './status-routing.module';
import { StatusComponent } from './status/status.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    StatusComponent
  ],
  imports: [
    CommonModule,
    StatusRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class StatusModule { }
