import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {

  @Input() 
  message: String;
  
  constructor(public activeModal: NgbActiveModal) { }

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
