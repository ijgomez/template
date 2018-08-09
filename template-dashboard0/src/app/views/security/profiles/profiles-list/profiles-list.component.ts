import { Component, OnInit } from '@angular/core';
import { DataTablePagination } from '../../../components/datatable/datatable-pagination.component';
import { Observable } from 'rxjs/Rx';
import { ProfilesService } from '../../../../services/security/profiles.service';
import { ProfileCriteria } from '../../../../domain/security/profile-criteria';
import { Profile } from '../../../../domain/security/profile';
import { ProfileComponent } from '../profile/profile.component';
import { ModalOptions } from '../../../components/modal/modal-options';
import { ModalRef } from '../../../components/modal/modal-ref';
import { Modal } from '../../../components/modal/modal';

@Component({
  selector: 'app-profiles-list',
  templateUrl: './profiles-list.component.html',
  styleUrls: ['./profiles-list.component.css']
})
export class ProfilesListComponent extends DataTablePagination implements OnInit {

  private options: ModalOptions = { size: 'lg'};

  constructor(private profilesService: ProfilesService, private modalService: Modal) {
    super('name', 'ASC');
  }

  ngOnInit() {
    this.reload();
  }

  handlerDoFilter(): Observable<any> {
    return this.profilesService.findByCriteria(this.buildCriteria());
  }

  handlerDoCount(): Observable<number> {
    return this.profilesService.countByCriteria(this.buildCriteria());
  }

  handlerBuildCriteria() {
    let criteria: ProfileCriteria;

    criteria = new ProfileCriteria();
    // TODO Pendiente de Implementar
    return criteria;
  }

  handlerExport(): Observable<any> {
    return this.profilesService.export(this.buildCriteria());
  }

  add(): void {
    const modal: ModalRef = this.modalService.open(ProfileComponent, this.options);
    modal.result.then(
      (result) => {
        this.reload();
      },
      (reason) => { }
    );
  }

  update(profile: Profile): void {
    let id: number;
    if (profile == null) {
      id = this.selectedItem.id;
    } else {
      this.selectedRow(profile);
      id = profile.id;
    }
    this.profilesService.read(id).subscribe(
      response => {
        this.selectedItem = null;
        const modal: ModalRef = this.modalService.open(ProfileComponent, this.options);
        (<ProfileComponent>modal.componentInstance).profile = response;
        modal.result.then(
          (result) => {
            this.reload();
          },
          (reason) => { }
        );
      },
      this.handlerError
    );
    // TODO Pendiente de Implementar
  }

  delete(profile: Profile): void {
    const modal: ModalRef = this.modalService.confirm('Profile Delete', 'Delete the profile. Are you sure?');
    modal.result.then(
      (result) => {
        this.profilesService.delete(this.selectedItem).subscribe(
          response => {
            this.reload();
          },
          this.handlerError
        );
        this.selectedItem = null;
      },
      (reason) => {
        console.log('execute: reason');
       }
    );
  }
}
