import { ReportParam } from "../../../../domain/reports/report-param";
import { QuestionBase } from "./question-base";
import { Injectable } from "@angular/core";
import { DropdownQuestion } from "./question-dropdown";
import { TextboxQuestion } from "./question-textbox";

@Injectable()
export class QuestionFactory {

    build(reportParams: ReportParam[]): QuestionBase<any>[] {
        const questions: QuestionBase<any>[] = [];
        
        reportParams.forEach(rp => {
            if (rp.type === 'SELECT') {
                questions.push(this.buildDropdownQuestion(rp));
            } else {
                questions.push(this.buildTextboxQuestion(rp));
            }
        });
        return questions.sort((a, b) => a.order - b.order);
    }


    buildDropdownQuestion(reportParam: ReportParam): DropdownQuestion {
        return new DropdownQuestion({
            key: reportParam.key,
            label: reportParam.label,
            value: reportParam.value,
            options: reportParam.options,
            required: reportParam.required,
            order: reportParam.order
          });
    }

    buildTextboxQuestion(reportParam: ReportParam): TextboxQuestion {
        return new TextboxQuestion({
            key: reportParam.key,
            label: reportParam.label,
            value: reportParam.value,
            required: reportParam.required,
            order: reportParam.order
          });
    }

}
