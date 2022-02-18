import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit, OnDestroy {

  @Input() 
  title: String | undefined = undefined;

  @Input() 
  message: String | undefined = undefined;

  constructor(public activeModal: NgbActiveModal) { }
  
  ngOnInit(): void { }
  
  ngOnDestroy(): void { }

  ok(): void {
    this.activeModal.close('OK');
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }

  cancel(): void {
    this.activeModal.dismiss('Close click');
  }

}
