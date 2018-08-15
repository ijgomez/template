import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { ActionsService } from '../../../../services/security/actions.service';
import { Action } from '../../../../domain/security/action';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit {

  actionForm: FormGroup;

  constructor(
    private activeRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private location: Location,
    private actionsService: ActionsService
  ) { }

  ngOnInit() {
    this.initForm();
    if (this.isEdit()) {
      this.loadData();
    }
  }

  initForm(): void {
    this.actionForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  isEdit(): Boolean {
    const id = this.activeRoute.snapshot.params['id'];
    return (id !== undefined);
  }

  loadData(): void {
    const id = this.activeRoute.snapshot.params['id'];
    this.actionsService.read(id).subscribe(p => {
      this.actionForm.setValue({
        name: p.name,
        description: p.description
      });
    });
  }

  onSubmit() {
    const action: Action = this.actionForm.value;
    let result: Observable<number>;
    console.warn(action);
    if (this.isEdit()) {
      action.id = Number(this.activeRoute.snapshot.params['id']);
      result = this.actionsService.update(action);
    } else {
      result = this.actionsService.create(action);
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
