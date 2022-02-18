import { Entity } from "../base/entity.model";

export interface ClusterNode extends Entity {

    hostname: String;

    startDatetime: Date;

    lastUpdateTime: Date;

    status: String;

    usedMemory: number;

    totalMemory: number;
}
