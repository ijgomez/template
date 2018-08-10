import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecurityHomeComponent } from './security-home/security-home.component';

const routes: Routes = [
  { path: '', component: SecurityHomeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecurityRoutingModule { }
