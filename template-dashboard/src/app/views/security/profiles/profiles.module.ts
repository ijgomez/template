import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfilesRoutingModule } from './profiles-routing.module';
import { ProfilesListComponent } from './profiles-list/profiles-list.component';

@NgModule({
  imports: [
    CommonModule,
    ProfilesRoutingModule
  ],
  declarations: [ProfilesListComponent]
})
export class ProfilesModule { }
