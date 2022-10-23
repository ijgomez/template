import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { TemplateFilterComponent } from 'src/app/shared/components/filter/template-filter/template-filter.component';
import { ClusterNodeCriteria } from 'src/app/core/models/system/cluster-node-criteria.model';
@Component({
  selector: 'app-cluster-filter',
  templateUrl: './cluster-filter.component.html',
  styleUrls: ['./cluster-filter.component.scss']
})
export class ClusterFilterComponent extends TemplateFilterComponent<ClusterNodeCriteria> implements OnInit {

  constructor(private formBuilder: UntypedFormBuilder) { 
    super(formBuilder.group({
      hostname: []
    }));
  }

  ngOnInit(): void {
  }

}
