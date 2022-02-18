import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PropertiesService } from 'src/app/core/services/system/properties.service';
import { TemplateListBaseComponent } from 'src/app/shared/components/list/base/template-list-base-component.component';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrls: ['./properties-list.component.scss']
})
export class PropertiesListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private propertiesService: PropertiesService
    ) { 
      super(router, route, modalService);
    }

  ngOnInit(): void {
    this.heading.push("System");
    this.heading.push("Properties");

    this.dtOptions = {
     
      columns: [
        { title: 'ID', data: 'id' }, 
        { title: 'Property', data: 'key' }, 
        { title: 'Value', data: 'value' }, 
        { title: 'Description', data: 'description' }
      ],
      order: [[1, "asc"]],
      ajax: (dataTablesParameters, callback) => {
        this.datatable(dataTablesParameters, callback);
      }
    };
    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected service(): any {
    return this.propertiesService;
  }

}
