import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../../../services/security/users.service';
import { UserCriteria } from '../../../../domain/security/user-criteria';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  data: any[];

  constructor(private usersService: UsersService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.usersService.findByCriteria(new UserCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }

  delete(id: number): void {
    this.usersService.read(id).subscribe(
    data => {
      this.usersService.delete(data).subscribe(
        result => { this.loadData(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }
}
