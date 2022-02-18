import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TemplateService } from '../base/template.service';
import { ClusterNodeCriteria } from '../../models/system/cluster-node-criteria.model';
import { ClusterNode } from '../../models/system/cluster-node.model';

@Injectable({
  providedIn: 'root'
})
export class ClusterService extends TemplateService<ClusterNode, ClusterNodeCriteria> {

  constructor(public http: HttpClient) { super(http, '/api/cluster/nodes'); }

}
