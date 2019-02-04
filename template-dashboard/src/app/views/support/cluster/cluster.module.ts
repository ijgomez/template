import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClusterRoutingModule } from './cluster-routing.module';
import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { ClusterNodeService } from '../../../services/support/cluster-node.service';

@NgModule({
  imports: [
    CommonModule,
    ClusterRoutingModule
  ],
  declarations: [ClusterListComponent],
  providers: [ClusterNodeService]
})
export class ClusterModule { }
