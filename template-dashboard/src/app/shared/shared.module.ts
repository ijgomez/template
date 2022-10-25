import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './components/header/header.component';
import { MenuComponent } from './components/menu/menu.component';
import { RouterModule } from '@angular/router';
import { MessageComponent } from './components/modal/message/message.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { DatatableComponent } from './components/datatable/datatable.component';
import { DataTablesModule } from 'angular-datatables';
import { TruncatePipe } from './pipes/truncate.pipe';
import { TemplateFilterComponent } from './components/filter/template-filter/template-filter.component';
import { TemplateListComponent } from './components/list/template-list/template-list.component';
import { DynamicFormComponent } from './components/forms/dynamic-form/dynamic-form.component';
import { DynamicFormQuestionComponent } from './components/forms/dynamic-form-question/dynamic-form-question.component';
import { ControlMessagesComponent } from './components/forms/control-messages/control-messages.component';
import { BackButtonComponent } from './components/buttons/back-button/back-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { TemplateFormComponent } from './components/forms/template-form/template-form.component';
import { ReportEngineComboComponent } from './components/combos/report-engine-combo/report-engine-combo.component';
import { ProfileComboComponent } from './components/combos/profile-combo/profile-combo.component';
import { ActionsSelectorComponent } from './components/selectors/actions-selector/actions-selector.component';
import { ConfirmComponent } from './components/modal/confirm/confirm.component';
import { SearchButtonComponent } from './components/buttons/search-button/search-button.component';
import { SaveButtonComponent } from './components/buttons/save-button/save-button.component';
import { CancelButtonComponent } from './components/buttons/cancel-button/cancel-button.component';
import { HeaderPageComponent } from './components/header-page/header-page.component';
import { ServerTimestampComponent } from './components/server-timestamp/server-timestamp.component';
import { TraceTypeComboComponent } from './components/combos/trace-type-combo/trace-type-combo.component';
import { InputDatetimeComponent } from './components/forms/input-datetime/input-datetime.component';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ShowMenuItemPipe } from './pipes/show-menu-item.pipe';

@NgModule({
  declarations: [
    HeaderComponent,
    HeaderPageComponent,
    MenuComponent,
    MessageComponent,
    ToolbarComponent,
    DatatableComponent,
    TruncatePipe,
    TemplateFilterComponent,
    TemplateListComponent,
    DynamicFormComponent, 
    DynamicFormQuestionComponent, 
    TemplateFormComponent,
    ControlMessagesComponent, 
    BackButtonComponent, SearchButtonComponent, SaveButtonComponent, CancelButtonComponent,
    ReportEngineComboComponent, ProfileComboComponent, TraceTypeComboComponent,
    ActionsSelectorComponent,
    ConfirmComponent,
    ServerTimestampComponent,
    InputDatetimeComponent,
    ShowMenuItemPipe
  ],
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    RouterModule,
    DataTablesModule,
    TranslateModule,
    NgbModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HeaderComponent,
    HeaderPageComponent,
    MenuComponent,
    MessageComponent,
    ToolbarComponent,
    DatatableComponent,
    TemplateListComponent,
    DynamicFormComponent, 
    DynamicFormQuestionComponent, 
    TemplateFormComponent, 
    ControlMessagesComponent,
    BackButtonComponent,SearchButtonComponent,SaveButtonComponent,CancelButtonComponent,
    ReportEngineComboComponent, ProfileComboComponent, TraceTypeComboComponent,
    ActionsSelectorComponent,
    ServerTimestampComponent,
    InputDatetimeComponent
  ]
})
export class SharedModule { }
