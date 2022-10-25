import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MenuService } from '../../../core/services/system/menu.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  @Output()
  logoutEvent = new EventEmitter<any>();

  navItems:any = [];

  constructor(
      private menuService: MenuService
    ) { }

  ngOnInit(): void {
    this.menuService.findItems().subscribe(r => {
      this.navItems = r;
    });
  }

  logout() {
    console.log('logout');
    this.logoutEvent.emit('logout');
  }

}
