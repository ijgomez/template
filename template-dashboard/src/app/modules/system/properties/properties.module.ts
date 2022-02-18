import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertiesListComponent } from './properties-list/properties-list.component';
import { PropertiesComponent } from './properties/properties.component';
import { PropertiesFilterComponent } from './properties-filter/properties-filter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    PropertiesListComponent,
    PropertiesComponent,
    PropertiesFilterComponent
  ],
  imports: [
    CommonModule,
    PropertiesRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class PropertiesModule { }
