import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropertiesListComponent } from './properties-list/properties-list.component';
import { PropertiesComponent } from './properties/properties.component';

const routes: Routes = [
  { path: '', component: PropertiesListComponent },
  { path: 'create', component: PropertiesComponent },
  { path: 'view/:id', component: PropertiesComponent },
  { path: 'edit/:id', component: PropertiesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertiesRoutingModule { }
