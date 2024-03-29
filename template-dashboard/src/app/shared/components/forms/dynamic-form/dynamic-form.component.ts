import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { QuestionBase } from '../questions/question-base';
import { UntypedFormGroup } from '@angular/forms';
import { QuestionControlService } from 'src/app/shared/services/question-control.service';


@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit {

  @Input()
  questions: QuestionBase<any>[] = [];

  form!: UntypedFormGroup;

  @Output()
  uploaded = new EventEmitter();

  @Output()
  cancelEvent = new EventEmitter();

  constructor(private qcs: QuestionControlService) {  }

  ngOnInit() {
    this.form = this.qcs.toFormGroup(this.questions);
  }

  onSubmit() {
     this.uploaded.emit(this.form);
  }

  onCancel() {
    this.cancelEvent.emit();
  }
}
