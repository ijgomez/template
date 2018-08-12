import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-profiles-list',
  templateUrl: './profiles-list.component.html',
  styleUrls: ['./profiles-list.component.css']
})
export class ProfilesListComponent implements OnInit {

  data: any[];

  constructor() { }

  ngOnInit() {
    this.data = [
      {id: 1, name: 'ADMIN', description: 'Administrator'},
      {id: 2, name: 'SUPPORT', description: 'Support'},
      {id: 3, name: 'USER', description: 'Operator'},
      {id: 4, name: 'MANAGER', description: 'Manager'}
    ];
  }

}
