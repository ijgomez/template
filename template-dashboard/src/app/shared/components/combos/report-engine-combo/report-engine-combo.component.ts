import { Component, OnInit, OnDestroy, forwardRef, Input, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReportEngine } from 'src/app/core/models/reports/report-engine.model';
import { ReportService } from '../../../../core/services/reports/report.service';

@Component({
  selector: 'app-report-engine-combo',
  templateUrl: './report-engine-combo.component.html',
  styleUrls: ['./report-engine-combo.component.scss'],
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReportEngineComboComponent),
      multi: true
    }
  ]
})
export class ReportEngineComboComponent implements ControlValueAccessor, OnInit, OnDestroy {

  public engines: Observable<ReportEngine[]> = new Observable<ReportEngine[]>();

  public _engineSelected: ReportEngine | null = null;

  get value(): any {
    return this._engineSelected;
  }

  set value(val: ReportEngine) {
    this._engineSelected = val;
    this.onChangeCallback(val);
  }

  isDisabled: boolean = false;

  @Input()
  id : String | null = null;

  @Input()
  name : string | null = null;

  @Output() 
  onchangeEvent:EventEmitter<ReportEngine> = new EventEmitter<ReportEngine>();

  onChangeCallback: Function = () => {};

  onTouchedCallback: Function = () => {};

  constructor(private reportService: ReportService) { }
  
  ngOnInit(): void {
    this.engines = this.reportService.engines();
  }

  ngOnDestroy(): void { }

  compareFn(re1: ReportEngine, re2: ReportEngine): boolean {
    return re1 && re2 ? re1.type === re2.type : re1 === re2;
  }

  writeValue(reportEngine: ReportEngine): void {
    this.value = reportEngine ?? null;
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

  onChange(data:ReportEngine):void {
    this.onchangeEvent.emit(data);
  }

}
