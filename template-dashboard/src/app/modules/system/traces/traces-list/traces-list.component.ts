import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TracesService } from 'src/app/core/services/system/traces.service';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { TemplateListBaseComponent } from 'src/app/shared/components/list/base/template-list-base-component.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-traces-list',
  templateUrl: './traces-list.component.html',
  styleUrls: ['./traces-list.component.scss'],
  providers: [TruncatePipe]
})
export class TracesListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private tracesService: TracesService,
      private truncatePipe: TruncatePipe
    ) { 
      super(router, route, modalService);
    }

  ngOnInit(): void {
    this.heading.push("System");
    this.heading.push("Traces");

    this.dtOptions = {
     
      columns: [
        { title: 'ID', data: 'id' }, 
        { title: 'Datetime', data: 'datetime'  }, 
        { title: 'Type', data: 'type' }, 
        { title: 'Message', data: 'message', ngPipeInstance: this.truncatePipe }
      ],
      order: [[1, "desc"]],
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
    return this.tracesService;
  }

}
