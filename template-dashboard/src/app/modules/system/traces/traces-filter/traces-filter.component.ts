import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { TraceCriteria } from 'src/app/core/models/system/trace-criteria.model';

@Component({
  selector: 'app-traces-filter',
  templateUrl: './traces-filter.component.html',
  styleUrls: ['./traces-filter.component.scss']
})
export class TracesFilterComponent extends TemplateFilterComponent<TraceCriteria> implements OnInit {

  constructor(private formBuilder: FormBuilder) { 
    super(formBuilder.group({
      type: [],
      message: [],
      fromDate: [],
      toDate: []
    }));
  }

  ngOnInit(): void {
  }

}
