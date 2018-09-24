import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DataHomeComponent } from './data-home/data-home.component';
import { ScriptListComponent } from './script-list/script-list.component';
import { RequestExecutorComponent } from './request-executor/request-executor.component';

const routes: Routes = [
    { path: '', component: DataHomeComponent, children: [
        { path: '', pathMatch: 'full', redirectTo: 'execute'},
        { path: 'execute', component: RequestExecutorComponent},
        { path: 'scripts', component: ScriptListComponent}
      ] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DataRoutingModule { }
