import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './modules/layout/login/login.component';

const routes: Routes = [
  { path: '', loadChildren: () => import(/* webpackChunkName: "layout" */ './modules/layout/layout.module').then( m => m.LayoutModule ), canActivate: [AuthGuard], data: { action: 'ACCESS'} },
  { path: 'home', loadChildren: () => import(/* webpackChunkName: "home" */ './modules/home/home.module').then( m => m.HomeModule ), canActivate: [AuthGuard], data: { action: 'DASHBOARD'} },
  { path: 'security', loadChildren: () => import(/* webpackChunkName: "security" */'./modules/security/security.module').then( m => m.SecurityModule ), canActivate: [AuthGuard], data: { action: 'SECURITY'} },
  { path: 'system', loadChildren: () => import(/* webpackChunkName: "system" */ './modules/system/system.module').then( m => m.SystemModule ), canActivate: [AuthGuard], data: { action: 'SYSTEM'} },
  { path: 'reports', loadChildren: () => import(/* webpackChunkName: "reports" */ './modules/reports/reports.module').then( m => m.ReportsModule ), canActivate: [AuthGuard], data: { action: 'REPORTS'} },
  { path: 'interfaces', loadChildren: () => import(/* webpackChunkName: "interfaces" */ './modules/interfaces/interfaces.module').then( m => m.InterfacesModule ), canActivate: [AuthGuard], data: { action: 'INTERFACES'} },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
