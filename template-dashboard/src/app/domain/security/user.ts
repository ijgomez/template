import { Entity } from '../base/entity';
import { Profile } from './profile';

export class User implements Entity {

    id: number;

    username: string;

    password: string;

    profile: Profile;

}
