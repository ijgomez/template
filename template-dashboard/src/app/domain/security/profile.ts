import { Entity } from '../base/entity';
import { Action } from './action';

export class Profile implements Entity {

    id: number;

    name: string;

    description: string;

    actions: Array<Action>;

}
