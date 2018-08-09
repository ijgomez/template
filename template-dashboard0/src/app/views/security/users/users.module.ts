import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UsersListComponent } from './users-list/users-list.component';
import { UserComponent } from './user/user.component';
import { ComponentsModule } from '../../components/components.module';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from 'clarity-angular';
import { UsersService } from '../../../services/security/users.service';
import { ProfilesService } from '../../../services/security/profiles.service';

@NgModule({
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule, ClarityModule, ComponentsModule
  ],
  declarations: [UsersListComponent, UserComponent],
  entryComponents: [UserComponent],
  providers: [UsersService, ProfilesService]
})
export class UsersModule { }
