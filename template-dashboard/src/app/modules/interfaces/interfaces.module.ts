import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InterfacesRoutingModule } from './interfaces-routing.module';
import { HomeComponent } from './home/home.component';


@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    InterfacesRoutingModule
  ]
})
export class InterfacesModule { }
