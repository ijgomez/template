import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfilesRoutingModule } from './profiles-routing.module';
import { ProfilesListComponent } from './profiles-list/profiles-list.component';
import { ProfileComponent } from './profile/profile.component';
import { ProfilesService } from '../../../services/security/profiles.service';
import { ComponentsModule } from '../../components/components.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule, ReactiveFormsModule,
    ProfilesRoutingModule,
    ComponentsModule
  ],
  declarations: [ProfilesListComponent, ProfileComponent],
  providers: [ProfilesService]
})
export class ProfilesModule { }
