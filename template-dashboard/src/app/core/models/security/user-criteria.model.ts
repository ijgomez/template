import { TemplateCriteria } from '../base/template-criteria.model';
import { ProfileCriteria } from './profile-criteria.model';

export class UserCriteria extends TemplateCriteria {

    username: String | undefined;

    profile: ProfileCriteria | undefined;

}
