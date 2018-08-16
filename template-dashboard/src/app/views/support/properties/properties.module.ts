import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertiesListComponent } from './properties-list/properties-list.component';
import { PropertyComponent } from './property/property.component';
import { ComponentsModule } from '../../components/components.module';
import { PropertiesService } from '../../../services/support/properties.service';

@NgModule({
  imports: [
    CommonModule, ReactiveFormsModule,
    PropertiesRoutingModule,
    ComponentsModule
  ],
  declarations: [PropertiesListComponent, PropertyComponent],
  providers: [PropertiesService]
})
export class PropertiesModule { }
