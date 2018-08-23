import { Component, OnInit } from '@angular/core';
import { ProfilesService } from '../../../../services/security/profiles.service';
import { ProfileCriteria } from '../../../../domain/security/profile-criteria';

@Component({
  selector: 'app-profiles-list',
  templateUrl: './profiles-list.component.html',
  styleUrls: ['./profiles-list.component.scss']
})
export class ProfilesListComponent implements OnInit {

  data: any[];

  constructor(private profilesService: ProfilesService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.profilesService.findByCriteria(new ProfileCriteria()).subscribe(
      result => { this.data = result; },
      error => { console.error(error); }
    );
  }

  delete(id: number): void {
    this.profilesService.read(id).subscribe(
    data => {
      this.profilesService.delete(data).subscribe(
        result => { this.loadData(); },
        error => { console.error(error); });
    },
    error => {
      console.error(error);
    });
  }
}
