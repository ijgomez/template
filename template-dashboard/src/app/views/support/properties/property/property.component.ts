import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';

import { PropertiesService } from '../../../../services/support/properties.service';
import { Property } from '../../../../domain/support/property';

@Component({
  selector: 'app-property',
  templateUrl: './property.component.html',
  styleUrls: ['./property.component.scss']
})
export class PropertyComponent implements OnInit {

  propertyForm: FormGroup;

  constructor(
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private location: Location,
    private propertiesService: PropertiesService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.isEdit()) {
      this.loadData();
    }
  }

  initForm(): void {
    this.propertyForm = this.formBuilder.group({
      property: ['', Validators.required],
      value: ['', Validators.required]
    });
  }

  isEdit(): Boolean {
    const id = this.activeRoute.snapshot.params['id'];
    return (id !== undefined);
  }

  loadData(): void {
    const id = this.activeRoute.snapshot.params['id'];
    this.propertiesService.read(id).subscribe(p => {
      this.propertyForm.setValue({
        property: p.property,
        value: p.value
      });
    });
  }

  onSubmit() {
    const property: Property = this.propertyForm.value;
    let result: Observable<number>;
    console.warn(property);
    if (this.isEdit()) {
      property.id = Number(this.activeRoute.snapshot.params['id']);
      result = this.propertiesService.update(property);
    } else {
      result = this.propertiesService.create(property);
    }
    result.subscribe(
      response => {
        console.log(response);
        this.location.back();
      },
      error => { console.error(error); }
    );
  }

}
