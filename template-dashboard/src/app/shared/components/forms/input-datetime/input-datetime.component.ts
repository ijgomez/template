import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbDate, NgbDateAdapter, NgbDateNativeAdapter, NgbDateNativeUTCAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-input-datetime',
  templateUrl: './input-datetime.component.html',
  styleUrls: ['./input-datetime.component.scss'],
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputDatetimeComponent),
      multi: true
    },
    { 
      provide: NgbDateAdapter,
      useClass: NgbDateNativeUTCAdapter
    }
  ],
  host: {
    '(change)': 'onChangeCallback($event)',
    '(blur)': 'onTouchedCallback()'
  }
})
export class InputDatetimeComponent implements ControlValueAccessor, OnInit, OnDestroy {

  @Input()
  id : String | null = null;

  @Input()
  name : string | null = null;

  isDisabled: boolean = false;

  private datetime: Date = new Date();

  private onChangeCallback: Function = () => {};

  private onTouchedCallback: Function = () => {};

  @Output() 
  onchangeEvent:EventEmitter<Date> = new EventEmitter<Date>();

  constructor() { }
  
  ngOnInit(): void { }

  ngOnDestroy(): void { }

  get value(): any {
    return this.datetime;
  }

  set value(date: any) {
    console.log('setValue -> ' + JSON.stringify(NgbDate.from(date)) + ' - ' +  (date instanceof NgbDate));
    this.datetime = date;
    this.onChangeCallback(date);
  }

  writeValue(date: any): void {
    console.log('writeValue -> ' + date);
    this.datetime = date;
  }

  registerOnChange(fn: Function): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onTouchedCallback = fn;
  }

  valueChange(data:Date):void {
    this.onchangeEvent.emit(data);
  }
}
