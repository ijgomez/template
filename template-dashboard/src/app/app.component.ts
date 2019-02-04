import { Component, ViewChild } from '@angular/core';
import { MenuComponent } from './views/layout/menu/menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  collapedSideBar: boolean;

  @ViewChild(MenuComponent) child: MenuComponent;

  constructor() { }

  receiveCollapsed($event) {
    this.collapedSideBar = $event;
    this.child.toggleCollapsed();
  }
}
