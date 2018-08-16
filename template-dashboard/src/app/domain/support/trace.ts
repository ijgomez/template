import { Entity } from '../base/entity';
import { TraceType } from './trace-type.enum';

export class Trace implements Entity {

    id: number;
    datetime: Date;
    message: string;
    type: TraceType;

}
