import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SupportRoutingModule } from './support-routing.module';
import { SupportHomeComponent } from './support-home/support-home.component';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    SupportRoutingModule, ComponentsModule
  ],
  declarations: [SupportHomeComponent]
})
export class SupportModule { }
