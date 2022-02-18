import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActionService } from '../../../../core/services/security/action.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplateListBaseComponent } from 'src/app/shared/components/list/base/template-list-base-component.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-action-list',
  templateUrl: './action-list.component.html',
  styleUrls: ['./action-list.component.scss']
})
export class ActionListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private actionService: ActionService
    ) { 
      super(router, route, modalService);
    }

  ngOnInit(): void {
    this.heading.push("Security");
    this.heading.push("Actions");

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
    return this.actionService;
  }

}
