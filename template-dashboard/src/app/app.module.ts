import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MenuComponent } from './views/layout/menu/menu.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { HeaderComponent } from './views/layout/header/header.component';
import { HeaderPageComponent } from './views/layout/header-page/header-page.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    DashboardComponent,
    HeaderPageComponent
  ],
  imports: [
    BrowserModule, AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
