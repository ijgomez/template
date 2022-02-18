import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProfileService } from 'src/app/core/services/security/profile.service';
import { TemplateFormBaseComponent } from 'src/app/shared/components/forms/base/template-form-base-component.component';
import { ProfileValidator } from 'src/app/core/models/security/profile-validator';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent extends TemplateFormBaseComponent implements OnInit, OnDestroy {

  public profileForm = this.formBuilder.group({
    id: [],
    name: [null, {
      validators: [Validators.required],
      updateOn: 'blur'
    }],
    description: [null, Validators.required],
    actions: [null, Validators.required]
  });

  constructor(
      protected formBuilder: FormBuilder,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      private profileService: ProfileService
    ) { 
      super(formBuilder, router, route, location);
    }
  

  ngOnInit(): void {
    this.heading.push("Security");
    this.heading.push("Profiles");
    
    super.ngOnInit();
    if (this.isCreateMode()) {
      this.form().get('name')?.addAsyncValidators(ProfileValidator.existName(this.profileService));
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected service(): any {
    return this.profileService;
  }

  protected form(): FormGroup {
    return this.profileForm;
  }

  protected handlerLoadEntity(data: any): void { }

  protected handlerDefaultDataForm(): void { }

  protected backPreviousView(): void {
    this.router.navigate(['/security/profiles'], { replaceUrl: true });
  }

}
