import { Response } from '@angular/http';
import { Observable } from 'rxjs';

export abstract class TemplateService {

    protected handleError(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            console.log('error response');
            const body = error.json() || '';
            const err = body.error || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            console.log('error');
            errMsg = error.message ? error.message : error.toString();
        }
        console.error('service error: ' + errMsg);
        console.error(error);
        return Observable.throw(error);
    }
}


