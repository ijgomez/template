import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SupportRoutingModule } from './support-routing.module';
import { SupportHomeComponent } from './support-home/support-home.component';

@NgModule({
  imports: [
    CommonModule,
    SupportRoutingModule
  ],
  declarations: [SupportHomeComponent]
})
export class SupportModule { }
