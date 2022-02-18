import { Entity } from '../base/entity.model';
import { Action } from './action.model';

export interface Profile extends Entity {

    name: String;

    description: String;

    actions: Array<Action>;
}
