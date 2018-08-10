import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';

const routes: Routes = [
    {path: '', component: DashboardComponent},
    { path: 'reports',  loadChildren: 'app/views/reports/reports.module#ReportsModule'},
    { path: 'monitors', loadChildren: 'app/views/monitors/monitors.module#MonitorsModule'},
    { path: 'security', loadChildren: 'app/views/security/security.module#SecurityModule'},
    { path: 'support',  loadChildren: 'app/views/support/support.module#SupportModule'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }