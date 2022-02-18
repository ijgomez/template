import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserComponent } from './user/user.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserFilterComponent } from './user-filter/user-filter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    UserListComponent,
    UserComponent,
    UserFilterComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class UsersModule { }
