import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormGroup, NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Rx';
import { ActiveModal } from '../../../components/modal/modal-ref';
import { User } from '../../../../domain/security/user';
import { UsersService } from '../../../../services/security/users.service';
import { ProfilesService } from '../../../../services/security/profiles.service';
import { Profile } from '../../../../domain/security/profile';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  @Input()
  user: User;

  @ViewChild('frm')
  formGroup: FormGroup;

  profiles: Profile[];

  constructor(public activeModal: ActiveModal,
    private usersService: UsersService,
    private profilesService: ProfilesService
  ) { }

  ngOnInit() {
    this.profilesService.loadAll().subscribe(values => this.profiles = values);
    if (this.user == null) {
      this.user = new User();
    }
  }

  isNewUser(): Boolean {
    return (this.user.id == null);
  }

  compareById(item1: any, item2: any) {
    return (item1 != null && item2 != null) && (item1.id === item2.id);
  }
  save(): void {
    try {
      let result: Observable<number>;
      console.log('save: ' + this.user);
      if (this.user.id === undefined) {
        result = this.usersService.create(this.user);
      } else {
        result = this.usersService.update(this.user);
      }
      result.subscribe(
        response => {
          console.log(response);
          this.activeModal.close(this.user);
        },
        error => { this.handlerError(error); }
      );
      // this.formGroup.reset();
    } catch (e) {
      this.handlerError(e);
    }
  }

  close(): void {
    this.activeModal.close('Close click');
  }

  dismiss(): void {
    this.activeModal.dismiss('Cross click');
  }

  hasErrors(ngModel: NgModel): boolean {
    return ngModel.invalid && (ngModel.dirty || ngModel.touched);
  }

  handlerError(e) {
    console.error(e);
    // TODO Pendiente de Implementar.
  }

}
