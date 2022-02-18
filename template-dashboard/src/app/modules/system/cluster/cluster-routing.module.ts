import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { ClusterComponent } from './cluster/cluster.component';

const routes: Routes = [
  { path: '', component: ClusterListComponent },
  { path: 'create', component: ClusterComponent },
  { path: 'view/:id', component: ClusterComponent },
  { path: 'edit/:id', component: ClusterComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClusterRoutingModule { }
