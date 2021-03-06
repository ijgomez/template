import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataRoutingModule } from './data-routing.module';
import { DataHomeComponent } from './data-home/data-home.component';
import { ComponentsModule } from '../components/components.module';
import { ScriptListComponent } from './script-list/script-list.component';
import { RequestExecutorComponent } from './request-executor/request-executor.component';

@NgModule({
  imports: [
    CommonModule,
    DataRoutingModule, ComponentsModule
  ],
  declarations: [DataHomeComponent, RequestExecutorComponent, ScriptListComponent]
})
export class DataModule { }
