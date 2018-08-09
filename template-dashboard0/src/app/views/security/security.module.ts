import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SecurityRoutingModule } from './security-routing.module';
import { SecurityHomeComponent } from './security-home/security-home.component';
import { ProfilesModule } from './profiles/profiles.module';
import { UsersModule } from './users/users.module';
import { ActionsModule } from './actions/actions.module';

@NgModule({
  imports: [
    CommonModule,
    SecurityRoutingModule, ProfilesModule, UsersModule, ActionsModule
  ],
  declarations: [SecurityHomeComponent]
})
export class SecurityModule { }
