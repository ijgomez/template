import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DataHomeComponent } from './data-home/data-home.component';
import { TableEditorComponent } from './table-editor/table-editor.component';
import { ScriptListComponent } from './script-list/script-list.component';

const routes: Routes = [
    { path: '', component: DataHomeComponent, children: [
        { path: '', component: TableEditorComponent},
        { path: 'editor', pathMatch: 'full', redirectTo: ''},
        { path: 'scripts', component: ScriptListComponent}
      ] }
];
  
@NgModule({
imports: [RouterModule.forChild(routes)],
exports: [RouterModule]
})
export class DataRoutingModule { }