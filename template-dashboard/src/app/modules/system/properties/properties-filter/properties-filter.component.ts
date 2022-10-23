import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { PropertyCriteria } from 'src/app/core/models/system/property-criteria.model';

@Component({
  selector: 'app-properties-filter',
  templateUrl: './properties-filter.component.html',
  styleUrls: ['./properties-filter.component.scss']
})
export class PropertiesFilterComponent extends TemplateFilterComponent<PropertyCriteria> implements OnInit {

  constructor(private formBuilder: UntypedFormBuilder) { 
    super(formBuilder.group({
      property: []
    }));
  }

  ngOnInit(): void {
  }

}
