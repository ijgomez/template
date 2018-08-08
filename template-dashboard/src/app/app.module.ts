import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NavComponent } from './views/layout/nav/nav.component';
import { FooterComponent } from './views/layout/footer/footer.component';
import { AppRoutingModule } from './app-routing.module';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { ReportsModule } from './views/reports/reports.module';
import { SupportModule } from './views/support/support.module';
import { SecurityModule } from './views/security/security.module';
import { MonitorsModule } from './views/monitors/monitors.module';
import { MenuComponent } from './views/layout/menu/menu.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    MenuComponent,
    FooterComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule, AppRoutingModule,
    ReportsModule, SupportModule, SecurityModule, MonitorsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
