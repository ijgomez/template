import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, children: [
    { path: 'properties', loadChildren: () => import(/* webpackChunkName: "properties" */'./properties/properties.module').then( m => m.PropertiesModule ) },
    { path: 'status', loadChildren: () => import(/* webpackChunkName: "status" */ './status/status.module').then( m => m.StatusModule ) },
    { path: 'cluster', loadChildren: () => import(/* webpackChunkName: "cluster" */ './cluster/cluster.module').then( m => m.ClusterModule ) },
    { path: 'traces', loadChildren: () => import(/* webpackChunkName: "traces" */ './traces/traces.module').then( m => m.TracesModule ) }
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SystemRoutingModule { }