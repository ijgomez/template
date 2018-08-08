import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { ReportsModule } from './views/reports/reports.module';

const routes: Routes = [
   { path: '', component: DashboardComponent},
   { path: 'reports', loadChildren: 'app/views/reports/reports.module#ReportsModule'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [ReportsModule]
})
export class AppRoutingModule {}

