import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { TraceType } from 'src/app/core/models/system/trace-type.model';
import { TracesService } from 'src/app/core/services/system/traces.service';

@Component({
  selector: 'app-trace-type-combo',
  templateUrl: './trace-type-combo.component.html',
  styleUrls: ['./trace-type-combo.component.scss'],
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TraceTypeComboComponent),
      multi: true
    }
  ]
})
export class TraceTypeComboComponent implements ControlValueAccessor, OnInit, OnDestroy {
  
  public types: Observable<TraceType[]> = new Observable<TraceType[]>();

  public _typeSelected: TraceType | null = null;

  get value(): any {
    return this._typeSelected;
  }

  set value(val: TraceType) {
    this._typeSelected = val;
    this.onChangeCallback(val);
  }

  isDisabled: boolean = false;

  @Input()
  id : String | null = null;

  @Input()
  name : string | null = null;

  @Output() 
  onchangeEvent:EventEmitter<TraceType> = new EventEmitter<TraceType>();

  onChangeCallback: Function = () => {};

  onTouchedCallback: Function = () => {};

  constructor(private tracesService: TracesService) { }
  
  ngOnInit(): void {
    this.types = this.tracesService.types();
  }

  ngOnDestroy(): void { }

  compareFn(t1: TraceType, t2: TraceType): boolean {
    return t1 && t2 ? t1 == t2: true;
  }

  writeValue(type: TraceType): void {
    this.value = type ?? null;
  }

  registerOnChange(fn: Function): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void { 
    this.isDisabled = isDisabled; 
  }

  onChange(data:TraceType):void {
    this.onchangeEvent.emit(data);
  }

}
