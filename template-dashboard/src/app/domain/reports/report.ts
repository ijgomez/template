import { Entity } from '../base/entity';
import { Archive } from '../archive/archive';

export class Report implements Entity {

    id: number;

    name: string;

    description: string;

    format: string;

    archive: Archive;

}
