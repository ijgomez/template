import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Action } from 'src/app/core/models/security/action.model';
import { ActionSelectComponent } from '../../../../modules/security/actions/action-select/action-select.component';

@Component({
  selector: 'app-actions-selector',
  templateUrl: './actions-selector.component.html',
  styleUrls: ['./actions-selector.component.scss'],
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ActionsSelectorComponent),
      multi: true
    }
  ]
})
export class ActionsSelectorComponent implements ControlValueAccessor, OnInit, OnDestroy {

  /** Actions in List. */
  public _value: Action[] | null = [];

  /** Action selected in List. */
  public action: Action | undefined;

  isDisabled: boolean = false;

  @Input()
  id : String | null = null;

  @Input()
  name : string | null = null;

  @Output() 
  onchangeEvent:EventEmitter<Action[]> = new EventEmitter<Action[]>();

  onChangeCallback: Function = () => {};

  onTouchedCallback: Function = () => {};

  constructor(private modalService: NgbModal) { }
  
  ngOnInit(): void { 
    
  }

  ngOnDestroy(): void { }

  compareFn(a1: Action, a2: Action): boolean {
    return a1 && a2 ? a1.id === a2.id : a1 === a2;
  }

  get value(): Action[] | null {
    return this._value;
  }

  set value(v: Action[] | null) {
    this._value = v;
    this.onChangeCallback(v);
  }

  writeValue(actions: Action[]): void {
    this.value = actions ?? null;
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

  onChange(data:Action[]):void {
    this.onchangeEvent.emit(data);
  }

  add():void {
    const modalRef = this.modalService.open(ActionSelectComponent, { 
      centered: true
    });
    modalRef.result.then(
      (select: Action[]) => {

        if (this.value == null) {
          this.value = select;
        } else {
          select.forEach( a => {
              if (!(this.position(a) >= 0)) {
                this.value?.push(a);
              }
          });
        }

      },
      (e: any) => { }
    );
  }

  private position(action: Action): number {
    var result = -1;
    var pos = -1;
    this.value?.forEach(a => {
      pos = pos + 1;
      if (a.id ==  action.id) {
        result = pos;
      }
    });
    return result;
  }

  remove():void {
    if (this.action != undefined) {
      this.value?.splice(this.value.indexOf(this.action), 1);
      if (this.value?.length == 0) {
        this.value = null;
      }
      this.action = undefined;
    }
  }

  selected(a: Action, event: MouseEvent): void {
    this.action = !(this.action && this.action?.id == a.id)? a: undefined;
  }

  isSelected(a: Action): boolean {
    return (a && a.id == this.action?.id);
  }
}
