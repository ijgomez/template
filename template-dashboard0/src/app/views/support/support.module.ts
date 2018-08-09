import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SupportRoutingModule } from './support-routing.module';
import { SupportHomeComponent } from './support-home/support-home.component';
import { TracesModule } from './traces/traces.module';
import { PropertiesModule } from './properties/properties.module';

@NgModule({
  imports: [
    CommonModule,
    SupportRoutingModule, TracesModule, PropertiesModule
  ],
  declarations: [SupportHomeComponent]
})
export class SupportModule { }
