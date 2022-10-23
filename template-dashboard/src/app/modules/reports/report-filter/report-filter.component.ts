import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { ReportCriteria } from 'src/app/core/models/reports/report-criteria.model';

@Component({
  selector: 'app-report-filter',
  templateUrl: './report-filter.component.html',
  styleUrls: ['./report-filter.component.scss']
})
export class ReportFilterComponent extends TemplateFilterComponent<ReportCriteria> implements OnInit {

  constructor(private formBuilder: UntypedFormBuilder) { 
    super(formBuilder.group({
      name: [],
      description: []
    }));
  }

  ngOnInit(): void {
  }

}
