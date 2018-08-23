import { Entity } from '../base/entity';

export class Report implements Entity {

    id: number;

    name: string;

    description: string;

    format: string;

    archive: any;

}
