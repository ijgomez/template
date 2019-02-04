import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  @Input() 
  title: String;

  @Input() 
  message: String;

  @Input() 
  details: String;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() { }

}
