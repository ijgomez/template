import { Archive } from '../archive/archive';
import { ReportParamOption } from './report-param-option';

export class ReportParam {

    key: string;

    label: string;

    options?: ReportParamOption[];

    order: Number;

    required: Boolean;

    type: string;

    value?: any;
}
