import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  public isRegisterSelected: boolean = true;

  @Input()
  public readOnly: boolean = false;

  @Input()
  public exec: boolean = false;

  constructor() { }

  @Output()
  toolbarEvent:EventEmitter<string> = new EventEmitter<string>();

  ngOnInit(): void {
  }

  public enable(): void {
      this.isRegisterSelected = false;    
  }

  public disable(): void {
    this.isRegisterSelected = true;
  }

  reload(): void {
    this.toolbarEvent.emit('reload');
  }

  edit(): void {
    this.toolbarEvent.emit('edit');
  }

  delete(): void {
    this.toolbarEvent.emit('delete');
  }

  execute(): void {
    this.toolbarEvent.emit('execute');
  }

  export(): void {
    this.toolbarEvent.emit('export');
  }

}
