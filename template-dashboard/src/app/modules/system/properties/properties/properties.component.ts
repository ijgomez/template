import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertiesService } from 'src/app/core/services/system/properties.service';
import { Location } from '@angular/common';
import { TemplateFormBaseComponent } from 'src/app/shared/components/forms/base/template-form-base-component.component';

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent extends TemplateFormBaseComponent implements OnInit, OnDestroy {
  
  public propertiesForm : FormGroup = this.formBuilder.group({
    id: [],
    key: ['', Validators.required],
    value: ['', Validators.required],
    description: ['']
  });;

  constructor(
      protected formBuilder: FormBuilder,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      private propertiesService: PropertiesService
    ) { 
      super(formBuilder, router, route, location);
    }

  ngOnInit(): void {
    this.heading.push("System");
    this.heading.push("Properties");
    
    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected service(): any {
    return this.propertiesService;
  }

  protected form(): FormGroup {
    return this.propertiesForm;
  }

  protected handlerLoadEntity(data: any): void { }

  protected handlerDefaultDataForm(): void { }

  protected backPreviousView(): void {
    this.router.navigate(['/system/properties'], { replaceUrl: true });
  }

}
