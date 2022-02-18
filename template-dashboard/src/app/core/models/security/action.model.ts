import { Entity } from "../base/entity.model";

export interface Action extends Entity {

    code: String;

    name: String;

    description: String;

}
