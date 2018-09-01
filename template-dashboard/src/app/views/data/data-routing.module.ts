import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DataHomeComponent } from './data-home/data-home.component';
import { TableEditorComponent } from './table-editor/table-editor.component';

const routes: Routes = [
    { path: '', component: DataHomeComponent, children: [
        { path: '', component: TableEditorComponent},
        { path: 'editor', pathMatch: 'full', redirectTo: ''},
      ] }
];
  
@NgModule({
imports: [RouterModule.forChild(routes)],
exports: [RouterModule]
})
export class DataRoutingModule { }