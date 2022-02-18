import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-template-filter',
  templateUrl: './template-filter.component.html',
  styleUrls: ['./template-filter.component.scss']
})
export class TemplateFilterComponent<C> implements OnInit, OnDestroy {

  filterForm: FormGroup;

  @Output()
  filterEvent:EventEmitter<C> = new EventEmitter<C>();
  
  constructor(filter: FormGroup) {
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
