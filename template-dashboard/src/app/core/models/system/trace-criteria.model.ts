import { TemplateCriteria } from "../base/template-criteria.model";
import { TraceType } from './trace-type.model';

export class TraceCriteria extends TemplateCriteria {
    
    type: TraceType | undefined;

    message: String | undefined;

    fromDate: Date | undefined;

    toDate: Date | undefined;
    
}
