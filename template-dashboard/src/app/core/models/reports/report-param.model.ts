import { ReportParamOption } from "./report-param-option.model";

export interface ReportParam {
    
    key: string;

    label: string;

    options?: ReportParamOption[];

    order: Number;

    required: Boolean;

    type: string;

    value?: any;
}
