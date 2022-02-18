import { Entity } from "../base/entity.model";

export interface Trace extends Entity {

    datetime: Date;

    type: String;

    message: String;
    
}
