import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { UserService } from "../../services/security/user.service";

export class UserValidator {
    
    static existUsername(userService: UserService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
          
            return userService.existByUsername(control.value).pipe(
                map((result: Boolean) =>  !result ? null : {'exists': true})
            );

        };
    }

    static password(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            // {6,100}           - Assert password is between 6 and 100 characters
            // (?=.*[0-9])       - Assert a string has at least one number
            if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
                return null;
             } else {
                return { 'invalidPassword': true };
            }
        };
    }
}
