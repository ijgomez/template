import { Component, OnInit } from '@angular/core';
import { DataTablePagination } from '../../../components/datatable/datatable-pagination.component';
import { Observable } from 'rxjs/Rx';
import { ModalOptions } from '../../../components/modal/modal-options';
import { UsersService } from '../../../../services/security/users.service';
import { Modal } from '../../../components/modal/modal';
import { UserCriteria } from '../../../../domain/security/user-criteria';
import { UserComponent } from '../user/user.component';
import { ModalRef } from '../../../components/modal/modal-ref';
import { User } from '../../../../domain/security/user';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent extends DataTablePagination implements OnInit {

  private options: ModalOptions = { size: 'lg'};

  constructor(private usersService: UsersService, private modalService: Modal) {
    super('username', 'ASC');
  }

  ngOnInit() {
    this.reload();
  }

  handlerDoFilter(): Observable<any> {
    return this.usersService.findByCriteria(this.buildCriteria());
  }

  handlerDoCount(): Observable<number> {
    return this.usersService.countByCriteria(this.buildCriteria());
  }

  handlerBuildCriteria() {
    let criteria: UserCriteria;

    criteria = new UserCriteria();
    // TODO Pendiente de Implementar
    return criteria;
  }

  handlerExport(): Observable<any> {
    return this.usersService.export(this.buildCriteria());
  }

  add(): void {
    const modal: ModalRef = this.modalService.open(UserComponent, this.options);
    modal.result.then(
      (result) => {
        this.reload();
      },
      (reason) => { }
    );
  }

  update(user: User): void {
    let id: number;
    if (user == null) {
      id = this.selectedItem.id;
    } else {
      this.selectedRow(user);
      id = user.id;
    }
    this.usersService.read(id).subscribe(
      response => {
        this.selectedItem = null;
        const modal: ModalRef = this.modalService.open(UserComponent, this.options);
        (<UserComponent>modal.componentInstance).user = response;
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

  delete(user: User): void {
    const modal: ModalRef = this.modalService.confirm('User Delete', 'Delete the user. Are you sure?');
    modal.result.then(
      (result) => {
        this.usersService.delete(this.selectedItem).subscribe(
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
