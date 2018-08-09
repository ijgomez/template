import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ServertimestampComponent } from './views/components/servertimestamp/servertimestamp.component';
import { StatusService } from './services/status/status.service';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { MenuComponent } from './views/commons/menu/menu.component';
import { HeaderComponent } from './views/commons/header/header.component';
import { FooterComponent } from './views/commons/footer/footer.component';
import { ReportsModule } from './views/reports/reports.module';
import { SupportModule } from './views/support/support.module';
import { SecurityModule } from './views/security/security.module';
import { MonitorModule } from './views/monitor/monitor.module';

import { ClarityModule } from 'clarity-angular';
import { ModalModule } from './views/components/modal/modal.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    FooterComponent,
    ServertimestampComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule, AppRoutingModule, HttpModule, ModalModule.forRoot(), ClarityModule.forRoot(),
    ReportsModule, SupportModule, SecurityModule, MonitorModule
  ],
  providers: [StatusService],
  bootstrap: [AppComponent]
})
export class AppModule { }
