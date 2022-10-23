import { Injectable } from '@angular/core';
import { UntypedFormControl, Validators, UntypedFormGroup } from '@angular/forms';
import { QuestionBase } from '../components/forms/questions/question-base';

@Injectable({
  providedIn: 'root'
})
export class QuestionControlService {

  constructor() { }

  toFormGroup(questions: QuestionBase<any>[] ) {
    const group: any = {};

    questions.forEach(question => {
      group[question.key] = question.required ? new UntypedFormControl(question.value || '', Validators.required)
                                              : new UntypedFormControl(question.value || '');
    });
    return new UntypedFormGroup(group);
  }
}
