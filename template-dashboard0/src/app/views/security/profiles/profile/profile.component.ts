import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormGroup, NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Rx';
import { ActiveModal } from '../../../components/modal/modal-ref';
import { Profile } from '../../../../domain/security/profile';
import { ProfilesService } from '../../../../services/security/profiles.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  @Input()
  profile: Profile;

  @ViewChild('frm')
  formGroup: FormGroup;

  constructor(public activeModal: ActiveModal, private profilesService: ProfilesService) { }

  ngOnInit() {
    if (this.profile == null) {
      this.profile = new Profile();
    }
  }

  isNewProfile(): Boolean {
    return (this.profile.id == null);
  }

  save(): void {
    try {
      let result: Observable<number>;
      console.log(this.profile);
      if (this.profile.id === undefined) {
        result = this.profilesService.create(this.profile);
      } else {
        result = this.profilesService.update(this.profile);
      }
      result.subscribe(
        response => {
          console.log(response);
          this.activeModal.close(this.profile);
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
