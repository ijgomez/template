import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfilesRoutingModule } from './profiles-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { ProfileListComponent } from './profile-list/profile-list.component';
import { ProfileFilterComponent } from './profile-filter/profile-filter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ProfileComponent,
    ProfileListComponent,
    ProfileFilterComponent
  ],
  imports: [
    CommonModule,
    ProfilesRoutingModule,
    FormsModule, ReactiveFormsModule,
    SharedModule
  ]
})
export class ProfilesModule { }
