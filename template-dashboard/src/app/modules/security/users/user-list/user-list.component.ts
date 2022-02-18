import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../core/services/security/user.service';
import { TemplateListBaseComponent } from 'src/app/shared/components/list/base/template-list-base-component.component';
import { DatePipe } from '@angular/common';
import { environment } from 'src/environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  providers: [DatePipe]
})
export class UserListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private userService: UserService,
      private datePipe: DatePipe
    ) { 
      super(router, route, modalService);
    }

  ngOnInit(): void { 
    this.heading.push("Security");
    this.heading.push("Users");

    var that = this;
    this.dtOptions = {
      columns: [
        { title: 'ID', data: 'id' }, 
        { title: 'Username', data: 'username' }, 
        { title: 'Last Access', data: 'lastAccess', render: function ( data, type, row ) {
          return that.datePipe.transform(data , environment.datetime.defaultFormat);
        } }, 
        { title: 'Profile', data: 'profile.name' }
      ],
      order: [[1, 'asc']],
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
    return this.userService;
  }
}
