import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ActionService } from 'src/app/core/services/security/action.service';
import { TemplateFormBaseComponent } from 'src/app/shared/components/forms/base/template-form-base-component.component';
import { ActionValidator } from 'src/app/core/models/security/action-validator';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss']
})
export class ActionComponent extends TemplateFormBaseComponent implements OnInit, OnDestroy {
  
  actionForm: UntypedFormGroup = this.formBuilder.group({
    id: [],
    name: [null, {
      validators: [Validators.required],
      updateOn: 'blur'
    }],
    description: [null, Validators.required]
  });

  constructor(
      protected formBuilder: UntypedFormBuilder,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      private actionService: ActionService
    ) { 
      super(formBuilder, router, route, location);
    }
  
  ngOnInit(): void {
    this.heading.push("Security");
    this.heading.push("Actions");
  
    super.ngOnInit();
    if (this.isCreateMode()) {
      this.form().get('name')?.addAsyncValidators(ActionValidator.existName(this.actionService));
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected service(): any {
    return this.actionService;
  }

  protected form(): UntypedFormGroup {
    return this.actionForm;
  }
  
  protected handlerLoadEntity(data: any): void { }

  protected handlerDefaultDataForm(): void { }

  protected backPreviousView(): void {
    this.router.navigate(['/security/actions'], { replaceUrl: true });
  }


}
