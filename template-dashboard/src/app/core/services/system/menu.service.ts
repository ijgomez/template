import { Injectable } from '@angular/core';
import {  Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private navItems:any = [
    {
      name: 'SECURITY',
      path: 'security',
      text: 'Security',
      icon: './assets/images/menu/icon.svg',
      role: 'STANDARD'
    },
    {
      name: 'SYSTEM',
      path: 'system',
      text: 'System',
      icon: './assets/images/menu/icon.svg',
      role: 'STANDARD'
    },
    {
      name: 'REPORT',
      path: 'reports',
      text: 'Reports',
      icon: './assets/images/menu/icon.svg',
      role: 'STANDARD'
    },
    {
      name: 'INTERFACES',
      path: 'interfaces',
      text: 'Interfaces',
      icon: './assets/images/menu/icon.svg',
      role: 'STANDARD'
    }
  ]

  constructor() { }

  findItems(): Observable<any> {
    return of(this.navItems);
  }
}
