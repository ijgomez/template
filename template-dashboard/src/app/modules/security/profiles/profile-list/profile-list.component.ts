import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from 'src/app/core/services/security/profile.service';
import { TemplateListBaseComponent } from 'src/app/shared/components/list/base/template-list-base-component.component';

@Component({
  selector: 'app-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss']
})
export class ProfileListComponent extends TemplateListBaseComponent implements OnInit, OnDestroy {

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected modalService: NgbModal,
      private profileService: ProfileService
    ) {
      super(router, route, modalService);
    }

  ngOnInit(): void {
    this.heading.push("Security");
    this.heading.push("Profiles");

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
    return this.profileService;
  }
}
