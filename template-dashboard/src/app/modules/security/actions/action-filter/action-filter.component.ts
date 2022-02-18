import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { ActionCriteria } from '../../../../core/models/security/action-criteria.model';

@Component({
  selector: 'app-action-filter',
  templateUrl: './action-filter.component.html',
  styleUrls: ['./action-filter.component.scss']
})
export class ActionFilterComponent extends TemplateFilterComponent<ActionCriteria> implements OnInit {

  constructor(private formBuilder: FormBuilder) {
    super(formBuilder.group({
      name: [],
      description: []
    }));
   }

  ngOnInit(): void {
  }

}
