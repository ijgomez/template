import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { BackButtonComponent } from './buttons/back-button/back-button.component';
import { ServertimestampComponent } from './servertimestamp/servertimestamp.component';

import { StatusService } from '../../services/commons/status.service';

@NgModule({
  imports: [
    CommonModule, HttpModule
  ],
  declarations: [BackButtonComponent, ServertimestampComponent],
  exports: [BackButtonComponent, ServertimestampComponent],
  providers: [StatusService]
})
export class ComponentsModule { }
