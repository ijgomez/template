import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProfilesService } from '../../../../services/security/profiles.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Profile } from '../../../../domain/security/profile';
import { Observable } from 'rxjs';
import { Action } from '../../../../domain/security/action';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  profileForm: FormGroup;

  allActions: Action[] = [
    {id: 1, name: 'REPORT_C', description: 'Report - Create'},
    {id: 2, name: 'REPORT_R', description: 'Report - Read'},
    {id: 3, name: 'REPORT_U', description: 'Report - Update'},
    {id: 4, name: 'REPORT_D', description: 'Report - Delete'},
    {id: 5, name: 'REPORT_E', description: 'Report - Execute'},
  ];

  constructor(
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private location: Location,
    private profilesService: ProfilesService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.isEdit()) {
      this.loadData();
    }
  }

  initForm(): void {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      actions: ['', Validators.required]
    });
  }

  isEdit(): Boolean {
    const id = this.activeRoute.snapshot.params['id'];
    return (id !== undefined);
  }

  loadData(): void {
    const id = this.activeRoute.snapshot.params['id'];
    this.profilesService.read(id).subscribe(p => {
      this.profileForm.setValue({
        name: p.name,
        description: p.description,
        actions: p.actions
      });
    });
  }

  onSubmit() {
    const profile: Profile = this.profileForm.value;
    let result: Observable<number>;
    console.warn(profile);
    if (this.isEdit()) {
      profile.id = Number(this.activeRoute.snapshot.params['id']);
      result = this.profilesService.update(profile);
    } else {
      result = this.profilesService.create(profile);
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
