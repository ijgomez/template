import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { BackButtonComponent } from './buttons/back-button/back-button.component';
import { ServertimestampComponent } from './servertimestamp/servertimestamp.component';

import { StatusService } from '../../services/commons/status.service';
import { DynamicFormComponent } from './forms/dynamic-form/dynamic-form.component';
import { DynamicFormQuestionComponent } from './forms/dynamic-form-question/dynamic-form-question.component';
import { QuestionControlService } from '../../services/commons/question-control.service';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule, HttpModule, ReactiveFormsModule
  ],
  declarations: [BackButtonComponent, ServertimestampComponent, DynamicFormComponent, DynamicFormQuestionComponent],
  exports: [BackButtonComponent, ServertimestampComponent, DynamicFormComponent, DynamicFormQuestionComponent],
  providers: [StatusService, QuestionControlService]
})
export class ComponentsModule { }
