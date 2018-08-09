import {NgModule, ModuleWithProviders} from '@angular/core';

import { ModalBackdropComponent } from './modal-backdrop.component';
import { ModalWindowComponent } from './modal-window.component';
import { ModalStack } from './modal-stack';
import { Modal } from './modal';


export { Modal } from './modal';
export { ModalRef, ActiveModal } from './modal-ref';
export { ModalDismissReasons } from './modal-dismiss-reasons';

@NgModule({
  declarations: [ModalBackdropComponent, ModalWindowComponent],
  entryComponents: [ModalBackdropComponent, ModalWindowComponent],
  providers: [Modal]
})
export class ModalModule {
  static forRoot(): ModuleWithProviders { return {ngModule: ModalModule, providers: [Modal, ModalStack]}; }
}
