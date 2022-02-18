import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-cancel-button',
  templateUrl: './cancel-button.component.html',
  styleUrls: ['./cancel-button.component.scss']
})
export class CancelButtonComponent implements OnInit, OnDestroy {

  @Output()
  clickEvent:EventEmitter<string> = new EventEmitter<string>();

  constructor() { }
  
  ngOnInit(): void { }

  ngOnDestroy(): void { }

  onClick():void {
    this.clickEvent.emit('Cancel');
  }
}
