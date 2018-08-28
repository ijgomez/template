import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SecurityRoutingModule } from './security-routing.module';
import { SecurityHomeComponent } from './security-home/security-home.component';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    SecurityRoutingModule,
    ComponentsModule
  ],
  declarations: [SecurityHomeComponent]
})
export class SecurityModule { }
