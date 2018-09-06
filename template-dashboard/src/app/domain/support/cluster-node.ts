import { Entity } from "../base/entity";
import { ClusterNodeStatus } from "./cluster-node-status.enum";

export class ClusterNode implements Entity {
    
    id: number;

    ip: string;
	
	hostname: string;
	
	startDatetime: Date;
	
	lastUpdateTime: Date;

	status: ClusterNodeStatus;
	
	usedMemory: Number;
	
	totalMemory: Number;
    
}
