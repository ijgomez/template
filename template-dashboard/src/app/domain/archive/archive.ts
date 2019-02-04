import { Entity } from '../base/entity';

export class Archive implements Entity {

    id: number;

    filename: String;

    filetype: String;

    value: any;
          
    size: number;

}
