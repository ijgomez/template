import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';

import { UsersService } from '../../../../services/security/users.service';
import { User } from '../../../../domain/security/user';
import { ProfilesService } from '../../../../services/security/profiles.service';
import { Profile } from '../../../../domain/security/profile';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  userForm: FormGroup;

  allProfiles: Profile[];

  constructor(
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private location: Location,
    private usersService: UsersService,
    private profilesService: ProfilesService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.isEdit()) {
      this.loadData();
    }
    this.profilesService.loadAll().subscribe(
      result => this.allProfiles = result,
      error => console.error(error)
    );
  }

  initForm(): void {
    this.userForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      profile: ['', Validators.required]
    });
  }

  isEdit(): Boolean {
    const id = this.activeRoute.snapshot.params['id'];
    return (id !== undefined);
  }

  loadData(): void {
    const id = this.activeRoute.snapshot.params['id'];
    this.usersService.read(id).subscribe(u => {
      this.userForm.setValue({
        username: u.username,
        password: u.password,
        profile: u.profile
      });
    });
  }

  onSubmit() {
    const user: User = this.userForm.value;
    let result: Observable<number>;
    console.warn(user);
    if (this.isEdit()) {
      user.id = Number(this.activeRoute.snapshot.params['id']);
      result = this.usersService.update(user);
    } else {
      result = this.usersService.create(user);
    }
    result.subscribe(
      response => {
        console.log(response);
        this.location.back();
      },
      error => { console.error(error); }
    );
  }

  compare(val1, val2) {
    return val1.id === val2.id;
  }

}


