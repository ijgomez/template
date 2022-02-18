import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-header-page',
  templateUrl: './header-page.component.html',
  styleUrls: ['./header-page.component.scss']
})
export class HeaderPageComponent implements OnInit, OnDestroy {

  @Input()
  heading: String[] = [];

  constructor() { }
  
  ngOnInit(): void { }

  ngOnDestroy(): void { }

  isHome() : boolean {
    return (0 == this.heading.length);
  }

  isLast(i: number): boolean {
    return ((i + 1) == this.heading.length);
  }
}
