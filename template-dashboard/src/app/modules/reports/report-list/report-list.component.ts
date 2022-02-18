import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportService } from 'src/app/core/services/reports/report.service';
import { TemplateListBaseComponent } from '../../../shared/components/list/base/template-list-base-component.component';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private reportService: ReportService
    ) { 
      super(router, route, modalService);
    }

  ngOnInit(): void {
    this.heading.push("Reports");

    this.dtOptions = {
      columns: [
        { title: 'ID', data: 'id' }, 
        { title: 'Name', data: 'name' }, 
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
    return this.reportService;
  }

}
