import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../core/services/security/user.service';
import { Location } from '@angular/common';
import { TemplateFormBaseComponent } from 'src/app/shared/components/forms/base/template-form-base-component.component';
import { UserValidator } from '../../../../core/models/security/user-validator';
import { CrytoService } from '../../../../core/services/security/cryto.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent extends TemplateFormBaseComponent implements OnInit, OnDestroy {
  
  public userForm = this.formBuilder.group({
      id: [],
      username: [null, {
        validators: [Validators.required],
        updateOn: 'blur'
      }],
      password: [null, Validators.required],
      profile: [null, Validators.required]
  });

  constructor(
    protected formBuilder: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected location: Location,
    private userService: UserService
  ) {  
    super(formBuilder, router, route, location); 
  }
  
  ngOnInit(): void {
    this.heading.push("Security");
    this.heading.push("Users");
    
    super.ngOnInit();
    if (this.isCreateMode()) {
      this.form().get('username')?.addAsyncValidators(UserValidator.existUsername(this.userService));
    }
  }

  ngOnDestroy(): void { 
    super.ngOnDestroy();
  }

  protected service() {
    return this.userService;
  }

  protected form(): FormGroup {
    return this.userForm;
  }
  
  protected handlerLoadEntity(data: any): void { }

  protected handlerDefaultDataForm(): void { }

  protected backPreviousView(): void {
     this.router.navigate(['/security/users'], { replaceUrl: true });
  }

}