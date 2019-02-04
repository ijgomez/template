import { Component, OnInit } from '@angular/core';
import { ClusterNodeService } from '../../../../services/support/cluster-node.service';
import { ClusterNodeCriteria } from '../../../../domain/support/cluster-node-criteria';

@Component({
  selector: 'app-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit {

  data: any[];

  constructor(private clusterNodeService: ClusterNodeService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.clusterNodeService.findByCriteria(new ClusterNodeCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }

  reload(): void {
    this.loadData();
  }
}
