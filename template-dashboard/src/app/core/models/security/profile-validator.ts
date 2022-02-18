import { AbstractControl, AsyncValidatorFn, ValidationErrors } from "@angular/forms";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ProfileService } from "../../services/security/profile.service";

export class ProfileValidator {

    static existName(profileService: ProfileService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
          
            return profileService.existByName(control.value).pipe(
                map((result: Boolean) =>  !result ? null : {'exists': true})
            );

        };
    }
}
