import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  @Output()
  logoutEvent = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  logout() {
    this.logoutEvent.emit('logout');
  }

}
