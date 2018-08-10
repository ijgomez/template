import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertiesListComponent } from './properties-list/properties-list.component';

@NgModule({
  imports: [
    CommonModule,
    PropertiesRoutingModule
  ],
  declarations: [PropertiesListComponent]
})
export class PropertiesModule { }
