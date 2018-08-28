import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  title = 'template-dashboard';

  pushRightClass = 'push-right';

  collapsed = false;

  @Output()
  collapsedEvent = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

  isToggled(): boolean {
    const dom: Element = document.querySelector('body');
    return dom.classList.contains(this.pushRightClass);
  }

  toggleSidebar() {
    const dom: any = document.querySelector('body');
    dom.classList.toggle(this.pushRightClass);
  }

  toggleCollapsed() {
    // alert('...');
    this.collapsed = !this.collapsed;
    this.collapsedEvent.emit(this.collapsed);
  }
}
