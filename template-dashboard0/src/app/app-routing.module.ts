import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';

const routes: Routes = [
    { path: '', component: DashboardComponent},
    { path: 'reports', loadChildren: 'app/views/reports/reports.module#ReportsModule' },
    { path: 'monitor', loadChildren: 'app/views/monitor/monitor.module#MonitorModule'}
];

@NgModule({
    // imports: [RouterModule.forRoot(routes, { enableTracing: true})],
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
