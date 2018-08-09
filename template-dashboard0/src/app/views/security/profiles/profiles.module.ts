import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from 'clarity-angular';

import { ProfilesRoutingModule } from './profiles-routing.module';
import { ProfilesListComponent } from './profiles-list/profiles-list.component';
import { ProfileComponent } from './profile/profile.component';

import { ProfilesService } from '../../../services/security/profiles.service';

import { ComponentsModule } from '../../components/components.module';
import { ModalConfirmComponent } from '../../components/modal-confirm/modal-confirm.component';

@NgModule({
  imports: [
    CommonModule,
    ProfilesRoutingModule,
    FormsModule, ClarityModule, ComponentsModule
  ],
  declarations: [ProfilesListComponent, ProfileComponent],
  entryComponents: [ProfileComponent],
  providers: [ProfilesService]
})
export class ProfilesModule { }
