import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-template-filter',
  templateUrl: './template-filter.component.html',
  styleUrls: ['./template-filter.component.scss']
})
export class TemplateFilterComponent<C> implements OnInit, OnDestroy {

  filterForm: UntypedFormGroup;

  @Output()
  filterEvent:EventEmitter<C> = new EventEmitter<C>();
  
  constructor(filter: UntypedFormGroup) {
    this.filterForm = filter;
  }
  
  ngOnInit(): void { }

  ngOnDestroy(): void { }
  
  isValidInput(fieldName: any): boolean {
    return this.filterForm.controls[fieldName].invalid && (this.filterForm.controls[fieldName].dirty || this.filterForm.controls[fieldName].touched);
  }

  filter(): void {
    this.filterEvent.emit(this.filterForm.value);
  }

}
