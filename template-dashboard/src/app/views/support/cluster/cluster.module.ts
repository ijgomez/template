import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClusterRoutingModule } from './cluster-routing.module';
import { ClusterListComponent } from './cluster-list/cluster-list.component';

@NgModule({
  imports: [
    CommonModule,
    ClusterRoutingModule
  ],
  declarations: [ClusterListComponent]
})
export class ClusterModule { }
