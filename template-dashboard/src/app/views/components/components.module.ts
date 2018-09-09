import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { ReactiveFormsModule } from '@angular/forms';

import { BackButtonComponent } from './buttons/back-button/back-button.component';
import { ServertimestampComponent } from './servertimestamp/servertimestamp.component';
import { DynamicFormComponent } from './forms/dynamic-form/dynamic-form.component';
import { DynamicFormQuestionComponent } from './forms/dynamic-form-question/dynamic-form-question.component';
import { ControlMessagesComponent } from './forms/control-messages/control-messages.component';
import { HeaderPageComponent } from './layout/header-page/header-page.component';

import { StatusService } from '../../services/commons/status.service';
import { QuestionControlService } from '../../services/commons/question-control.service';

@NgModule({
  imports: [
    CommonModule, HttpModule, ReactiveFormsModule
  ],
  declarations: [BackButtonComponent, ServertimestampComponent,
    DynamicFormComponent, DynamicFormQuestionComponent, ControlMessagesComponent, HeaderPageComponent],
  exports: [BackButtonComponent, ServertimestampComponent, DynamicFormComponent, DynamicFormQuestionComponent,
    ControlMessagesComponent, HeaderPageComponent],
  providers: [StatusService, QuestionControlService]
})
export class ComponentsModule { }
