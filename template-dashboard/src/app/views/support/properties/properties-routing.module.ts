import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PropertiesListComponent } from './properties-list/properties-list.component';

const routes: Routes = [
  //{ path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: '', component: PropertiesListComponent },
  { path: 'list', component: PropertiesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertiesRoutingModule { }
