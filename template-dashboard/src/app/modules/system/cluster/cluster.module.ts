import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClusterRoutingModule } from './cluster-routing.module';
import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { ClusterComponent } from './cluster/cluster.component';
import { ClusterFilterComponent } from './cluster-filter/cluster-filter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ClusterListComponent,
    ClusterComponent,
    ClusterFilterComponent
  ],
  imports: [
    CommonModule,
    ClusterRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class ClusterModule { }
