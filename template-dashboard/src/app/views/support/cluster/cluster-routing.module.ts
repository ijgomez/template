import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClusterListComponent } from './cluster-list/cluster-list.component';

const routes: Routes = [
    { path: '', component: ClusterListComponent},
    { path: 'list', component: ClusterListComponent}
];

@NgModule({
imports: [RouterModule.forChild(routes)],
exports: [RouterModule]
})
export class ClusterRoutingModule { }
