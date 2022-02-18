import { Entity } from "../base/entity.model";
import { Profile } from "./profile.model";

export interface User extends Entity {

    username: String;

    password: String;

    profile: Profile;

    lastAccess: Date;
    
}
