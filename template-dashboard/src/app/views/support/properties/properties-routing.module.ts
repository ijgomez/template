import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PropertiesListComponent } from './properties-list/properties-list.component';
import { PropertyComponent } from './property/property.component';

const routes: Routes = [
  { path: '', component: PropertiesListComponent },
  { path: 'create', component: PropertyComponent },
  { path: 'edit/:id', component: PropertyComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertiesRoutingModule { }
