import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataRoutingModule } from './data-routing.module';
import { DataHomeComponent } from './data-home/data-home.component';
import { TableEditorComponent } from './table-editor/table-editor.component';
import { ComponentsModule } from '../components/components.module';
import { ScriptListComponent } from './script-list/script-list.component';

@NgModule({
  imports: [
    CommonModule,
    DataRoutingModule, ComponentsModule
  ],
  declarations: [DataHomeComponent, TableEditorComponent, ScriptListComponent]
})
export class DataModule { }
