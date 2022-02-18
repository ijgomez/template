import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClusterService } from 'src/app/core/services/system/cluster.service';
import { TemplateListBaseComponent } from 'src/app/shared/components/list/base/template-list-base-component.component';

@Component({
  selector: 'app-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private clusterService: ClusterService
    ) { 
      super(router, route, modalService);
    }

  ngOnInit(): void {
    this.heading.push("System");
    this.heading.push("Cluster");

    this.dtOptions = {
      columns: [
        { title: 'ID', data: 'id' }, 
        { title: 'Hostname', data: 'hostname' }, 
        { title: 'Start Datetime', data: 'startDatetime' }, 
        { title: 'Last Update Time', data: 'lastUpdateTime' }, 
        { title: 'Status', data: 'status' }, 
        { title: 'Used Memory', data: 'usedMemory' }, 
        { title: 'Total Memory', data: 'totalMemory' }
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
    return this.clusterService;
  }

}
