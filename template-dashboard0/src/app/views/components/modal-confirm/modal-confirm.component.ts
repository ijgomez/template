import { Component, OnInit } from '@angular/core';
import { ActiveModal } from '../modal/modal-ref';

@Component({
  selector: 'app-modal-confirm',
  templateUrl: './modal-confirm.component.html',
  styleUrls: ['./modal-confirm.component.css']
})
export class ModalConfirmComponent implements OnInit {

  title: String = 'Confirm Dialog';

  message: String = 'modal-confirm works!';

  constructor(public activeModal: ActiveModal) { }

  ngOnInit() {
  }

  cancel(): void {
    this.activeModal.dismiss('Close click');
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }

  ok(): void {
    this.activeModal.close('OK');
  }

}
