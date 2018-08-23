import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UsersListComponent } from './users-list/users-list.component';
import { UserComponent } from './user/user.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from '../../components/components.module';
import { UsersService } from '../../../services/security/users.service';
import { ProfilesService } from '../../../services/security/profiles.service';

@NgModule({
  imports: [
    CommonModule, ReactiveFormsModule,
    UsersRoutingModule,
    ComponentsModule
  ],
  declarations: [UsersListComponent, UserComponent],
  providers: [UsersService, ProfilesService]
})
export class UsersModule { }
