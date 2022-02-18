import { AbstractControl, AsyncValidatorFn, ValidationErrors } from "@angular/forms";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ActionService } from "../../services/security/action.service";

export class ActionValidator {

    static existName(actionService: ActionService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
          
            return actionService.existByName(control.value).pipe(
                map((result: Boolean) =>  !result ? null : {'exists': true})
            );

        };
    }

}
