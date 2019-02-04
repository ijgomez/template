import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SupportHomeComponent } from './support-home/support-home.component';

const routes: Routes = [
  { path: '', component: SupportHomeComponent, children: [
    { path: 'traces', loadChildren: 'app/views/support/traces/traces.module#TracesModule'},
    { path: 'properties', loadChildren: 'app/views/support/properties/properties.module#PropertiesModule'},
    { path: 'cluster', loadChildren: 'app/views/support/cluster/cluster.module#ClusterModule'}
  ] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SupportRoutingModule { }
