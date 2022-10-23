import { Component, OnInit, Input } from '@angular/core';
import { QuestionBase } from '../questions/question-base';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-dynamic-form-question',
  templateUrl: './dynamic-form-question.component.html',
  styleUrls: ['./dynamic-form-question.component.scss']
})
export class DynamicFormQuestionComponent implements OnInit {

  @Input()
  question!: QuestionBase<any>;

  @Input()
  form!: UntypedFormGroup;

  constructor() { }

  ngOnInit() { }

  isValidInput(fieldName: any): boolean {
    return this.form.controls[fieldName].invalid && (this.form.controls[fieldName].dirty || this.form.controls[fieldName].touched);
  }
}
