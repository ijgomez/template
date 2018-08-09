import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServertimestampComponent } from './servertimestamp/servertimestamp.component';
import { ModalConfirmComponent } from './modal-confirm/modal-confirm.component';
import { ClarityModule } from 'clarity-angular';

@NgModule({
  imports: [
    CommonModule, ClarityModule
  ],
  entryComponents: [ModalConfirmComponent],
  declarations: [ModalConfirmComponent]
})
export class ComponentsModule { }
