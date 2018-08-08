import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertyListComponent } from './property-list/property-list.component';
import { PropertyComponent } from './property/property.component';

@NgModule({
  imports: [
    CommonModule,
    PropertiesRoutingModule
  ],
  declarations: [PropertyListComponent, PropertyComponent]
})
export class PropertiesModule { }
